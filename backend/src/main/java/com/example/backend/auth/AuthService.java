package com.example.backend.auth;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.security.SecureRandom;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.auth.dto.EmailVerificationResponse;
import com.example.backend.auth.dto.ForgotPasswordResetRequest;
import com.example.backend.auth.dto.StaffLoginRequest;
import com.example.backend.auth.dto.StaffLoginType;
import com.example.backend.auth.dto.StudentLoginRequest;
import com.example.backend.auth.dto.StudentRegisterRequest;
import com.example.backend.auth.dto.StudentRegistrationResponse;
import com.example.backend.auth.dto.SuperadminLoginRequest;
import com.example.backend.mail.EmailService;
import com.example.backend.user.Role;
import com.example.backend.user.User;
import com.example.backend.user.UserRepository;

@Service
public class AuthService {

	private static final Logger log = LoggerFactory.getLogger(AuthService.class);
	private static final SecureRandom SECURE_RANDOM = new SecureRandom();

	private final UserRepository userRepository;

	private final PasswordEncoder passwordEncoder;

	private final JwtService jwtService;

	private final EmailService emailService;

	@Value("${app.email.verification.otp-valid-minutes:5}")
	private long verificationOtpValidMinutes;

	@Value("${app.email.password-reset.otp-valid-minutes:5}")
	private long passwordResetOtpValidMinutes;

	@Value("${app.email.log-verification-otp:false}")
	private boolean logVerificationOtp;

	public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService,
			EmailService emailService) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
		this.emailService = emailService;
	}

	public StudentRegistrationResponse registerStudent(StudentRegisterRequest request) {
		if (!request.password().equals(request.confirmPassword())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Passwords do not match");
		}
		String email = request.email().trim().toLowerCase();
		if (email.endsWith("@smartcampus.local")) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Use a real email address to receive the verification link.");
		}
		if (userRepository.existsByEmailIgnoreCase(email)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
		}
		User user = new User();
		user.setEmail(email);
		user.setPasswordHash(passwordEncoder.encode(request.password()));
		user.setFullName(request.fullName().trim());
		user.setRole(Role.STUDENT);
		user.setCreatedAt(Instant.now());

		if (!emailService.isEnabled()) {
			user.setVerified(true);
			user.setVerificationOtp(null);
			user.setVerificationOtpExpiresAt(null);
			userRepository.save(user);
			return new StudentRegistrationResponse(
					"Account created. Email verification is disabled in this environment — you can sign in now.", email);
		}

		user.setVerified(false);
		String otp = generateOtp();
		user.setVerificationOtp(otp);
		user.setVerificationOtpExpiresAt(Instant.now().plus(verificationOtpValidMinutes, ChronoUnit.MINUTES));
		userRepository.save(user);

		try {
			emailService.sendVerificationOtp(email, otp);
		} catch (Exception ex) {
			userRepository.delete(user);
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
					"Could not send verification OTP email. Please try again later.");
		}
		if (logVerificationOtp) {
			log.warn("Verification OTP generated for {} -> {}", email, otp);
		}
		return new StudentRegistrationResponse(
				"Registration successful. Check your email for the OTP to verify your account before signing in.", email);
	}

	public EmailVerificationResponse verifyOtp(String rawEmail, String rawOtp) {
		if (rawEmail == null || rawEmail.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
		}
		if (rawOtp == null || rawOtp.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP is required");
		}
		String email = rawEmail.trim().toLowerCase();
		User user = userRepository.findByEmail(email)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No account found for that email"));
		String otp = rawOtp.trim();
		if (!otp.equals(user.getVerificationOtp())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OTP");
		}
		Instant expiresAt = user.getVerificationOtpExpiresAt();
		if (expiresAt != null && Instant.now().isAfter(expiresAt)) {
			user.setVerificationOtp(null);
			user.setVerificationOtpExpiresAt(null);
			userRepository.save(user);
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP has expired");
		}

		user.setVerified(true);
		user.setVerificationOtp(null);
		user.setVerificationOtpExpiresAt(null);
		userRepository.save(user);
		return new EmailVerificationResponse("Email verified successfully. You can now sign in.", true);
	}

	public StudentRegistrationResponse resendStudentVerification(String rawEmail) {
		if (!emailService.isEnabled()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email verification is disabled on this server.");
		}

		String email = rawEmail.trim().toLowerCase();
		User user = userRepository.findByEmail(email)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No account found for that email"));
		Role effectiveRole = user.getRole() == null ? Role.STUDENT : user.getRole();
		if (effectiveRole != Role.STUDENT) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This account is not a student account");
		}
		if (Boolean.TRUE.equals(user.getVerified())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This account is already verified");
		}

		String otp = generateOtp();
		user.setVerificationOtp(otp);
		user.setVerificationOtpExpiresAt(Instant.now().plus(verificationOtpValidMinutes, ChronoUnit.MINUTES));
		userRepository.save(user);

		try {
			emailService.sendVerificationOtp(email, otp);
		} catch (Exception ex) {
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
					"Could not send verification OTP email. Please try again later.");
		}
		if (logVerificationOtp) {
			log.warn("Resent verification OTP for {} -> {}", email, otp);
		}
		return new StudentRegistrationResponse("A new verification OTP has been sent. Check your inbox.", email);
	}

	public StudentRegistrationResponse sendForgotPasswordOtp(String rawEmail) {
		String email = rawEmail.trim().toLowerCase();
		User user = userRepository.findByEmail(email)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No account found for that email"));
		String otp = generateOtp();
		user.setPasswordResetOtp(otp);
		user.setPasswordResetOtpExpiresAt(Instant.now().plus(passwordResetOtpValidMinutes, ChronoUnit.MINUTES));
		userRepository.save(user);
		try {
			emailService.sendPasswordResetOtp(email, otp);
		} catch (Exception ex) {
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
					"Could not send password reset OTP email. Please try again later.");
		}
		return new StudentRegistrationResponse("Password reset OTP sent. Check your email.", email);
	}

	public EmailVerificationResponse verifyForgotPasswordOtp(String rawEmail, String rawOtp) {
		User user = resolveUserWithValidPasswordResetOtp(rawEmail, rawOtp);
		// OTP remains valid until reset call so user can proceed to reset form.
		return new EmailVerificationResponse("OTP verified. You can now reset your password.", true);
	}

	public StudentRegistrationResponse resetPasswordWithOtp(ForgotPasswordResetRequest request) {
		if (!request.newPassword().equals(request.confirmPassword())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Passwords do not match");
		}
		User user = resolveUserWithValidPasswordResetOtp(request.email(), request.otp());
		user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
		user.setPasswordResetOtp(null);
		user.setPasswordResetOtpExpiresAt(null);
		userRepository.save(user);
		return new StudentRegistrationResponse("Password reset successful. You can now sign in.", user.getEmail());
	}

	public AuthResponse loginStudent(StudentLoginRequest request) {
		User user = loadUserForPasswordCheck(request.email(), request.password());
		Role effective = user.getRole() == null ? Role.STUDENT : user.getRole();
		if (effective != Role.STUDENT) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN,
					"This account is not a student account. Please use the staff or superadmin login page.");
		}
		if (user.getRole() == null) {
			user.setRole(Role.STUDENT);
			userRepository.save(user);
		}
		requireVerifiedForStudentLogin(user);
		return tokenFor(user);
	}

	public AuthResponse loginSuperadmin(SuperadminLoginRequest request) {
		User user = loadUserForPasswordCheck(request.email(), request.password());
		if (user.getRole() != Role.SUPERADMIN) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN,
					"This account is not a superadmin. Use the correct login page for your role.");
		}
		return tokenFor(user);
	}

	public AuthResponse loginStaff(StaffLoginRequest request) {
		User user = loadUserForPasswordCheck(request.email(), request.password());
		Role role = user.getRole();
		if (role == null) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account has no assigned role.");
		}
		if (request.loginType() == StaffLoginType.ADMIN) {
			if (role != Role.ADMIN) {
				throw new ResponseStatusException(HttpStatus.FORBIDDEN,
						"This login is for administrators only. Your account does not have the Admin role.");
			}
		}
		else if (request.loginType() == StaffLoginType.TECHNICIAN) {
			if (role != Role.TECHNICIAN) {
				throw new ResponseStatusException(HttpStatus.FORBIDDEN,
						"This login is for technicians only. Your account does not have the Technician role.");
			}
		}
		return tokenFor(user);
	}

	private User loadUserForPasswordCheck(String rawEmail, String rawPassword) {
		String email = rawEmail.trim().toLowerCase();
		User user = userRepository.findByEmail(email)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
		if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
		}
		return user;
	}

	private AuthResponse tokenFor(User user) {
		Role role = user.getRole() == null ? Role.STUDENT : user.getRole();
		String token = jwtService.generateToken(user.getId(), user.getEmail(), role);
		return AuthResponse.of(token, user.getEmail(), user.getFullName(), role);
	}

	/**
	 * {@code verified == false} blocks login; {@code null} treated as verified for legacy/seeded users.
	 */
	private void requireVerifiedForStudentLogin(User user) {
		if (Boolean.FALSE.equals(user.getVerified())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN,
					"Please verify your email before logging in");
		}
	}

	private User resolveUserWithValidPasswordResetOtp(String rawEmail, String rawOtp) {
		if (rawEmail == null || rawEmail.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
		}
		if (rawOtp == null || rawOtp.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP is required");
		}
		String email = rawEmail.trim().toLowerCase();
		String otp = rawOtp.trim();
		User user = userRepository.findByEmail(email)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No account found for that email"));
		if (!otp.equals(user.getPasswordResetOtp())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OTP");
		}
		Instant expiresAt = user.getPasswordResetOtpExpiresAt();
		if (expiresAt == null || Instant.now().isAfter(expiresAt)) {
			user.setPasswordResetOtp(null);
			user.setPasswordResetOtpExpiresAt(null);
			userRepository.save(user);
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP has expired");
		}
		return user;
	}

	private String generateOtp() {
		int value = SECURE_RANDOM.nextInt(1_000_000);
		return String.format("%06d", value);
	}

}
