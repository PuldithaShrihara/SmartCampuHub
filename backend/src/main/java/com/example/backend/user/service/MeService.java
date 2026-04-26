package com.example.backend.user.service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.auth.GoogleOAuthTokenService;
import com.example.backend.auth.GoogleOAuthTokenService.GoogleUserPayload;
import com.example.backend.booking.entity.Booking;
import com.example.backend.booking.repository.BookingRepository;
import com.example.backend.common.service.FileStorageService;
import com.example.backend.incident.entity.Incident;
import com.example.backend.incident.repository.IncidentRepository;
import com.example.backend.mail.EmailService;
import com.example.backend.notifications.NotificationService;
import com.example.backend.notifications.NotificationType;
import com.example.backend.notifications.dto.CreateNotificationRequest;
import com.example.backend.user.dto.me.ChangePasswordRequest;
import com.example.backend.user.dto.me.MeProfileDto;
import com.example.backend.user.dto.me.UpdateProfileRequest;
import com.example.backend.user.dto.me.UserPreferencesDto;
import com.example.backend.user.entity.Role;
import com.example.backend.user.entity.User;
import com.example.backend.user.entity.UserPreferences;
import com.example.backend.user.repository.UserRepository;

/**
 * Backs the {@code /api/me/*} endpoints exposed by {@link com.example.backend.user.controller.MeController}.
 * Resolves the caller from the JWT principal e-mail and centralises mutation rules
 * for profile/password/preferences/Google-link/avatar/data-export.
 */
@Service
public class MeService {

	private static final SecureRandom SECURE_RANDOM = new SecureRandom();

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final BookingRepository bookingRepository;
	private final IncidentRepository incidentRepository;
	private final EmailService emailService;
	private final GoogleOAuthTokenService googleOAuthTokenService;
	private final FileStorageService fileStorageService;
	private final NotificationService notificationService;

	@Value("${app.email.verification.otp-valid-minutes:5}")
	private long verificationOtpValidMinutes;

	public MeService(UserRepository userRepository,
			PasswordEncoder passwordEncoder,
			BookingRepository bookingRepository,
			IncidentRepository incidentRepository,
			EmailService emailService,
			GoogleOAuthTokenService googleOAuthTokenService,
			FileStorageService fileStorageService,
			NotificationService notificationService) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.bookingRepository = bookingRepository;
		this.incidentRepository = incidentRepository;
		this.emailService = emailService;
		this.googleOAuthTokenService = googleOAuthTokenService;
		this.fileStorageService = fileStorageService;
		this.notificationService = notificationService;
	}

	public MeProfileDto getProfile(String authenticatedEmail) {
		return toDto(loadUser(authenticatedEmail));
	}

	public MeProfileDto updateProfile(String authenticatedEmail, UpdateProfileRequest request) {
		User user = loadUser(authenticatedEmail);
		if (request != null) {
			if (request.getFullName() != null) {
				String name = request.getFullName().trim();
				if (name.length() < 2 || name.length() > 60) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
							"Full name must be between 2 and 60 characters");
				}
				user.setFullName(name);
			}
			if (request.getAvatarUrl() != null) {
				user.setAvatarUrl(request.getAvatarUrl().isBlank() ? null : request.getAvatarUrl().trim());
			}
		}
		return toDto(userRepository.save(user));
	}

	public MeProfileDto uploadAvatar(String authenticatedEmail, MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Avatar file is required");
		}
		String contentType = file.getContentType();
		if (contentType == null || !contentType.toLowerCase().startsWith("image/")) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Avatar must be an image file");
		}
		User user = loadUser(authenticatedEmail);
		String relativePath = fileStorageService.storeFile(file, "avatars");
		user.setAvatarUrl(relativePath);
		return toDto(userRepository.save(user));
	}

	public void changePassword(String authenticatedEmail, ChangePasswordRequest request) {
		if (request == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
		}
		User user = loadUser(authenticatedEmail);
		if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"This account uses Google sign-in only. Set a password from the forgot-password flow first.");
		}
		if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Current password is incorrect");
		}
		if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"New password must be different from the current password");
		}
		user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
		userRepository.save(user);
		notifyUser(user.getEmail(), "Your password was changed successfully.", NotificationType.SYSTEM);
	}

	public String resendVerification(String authenticatedEmail) {
		User user = loadUser(authenticatedEmail);
		if (Boolean.TRUE.equals(user.getVerified())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This account is already verified");
		}
		if (!emailService.isEnabled()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email verification is disabled on this server");
		}
		String otp = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
		user.setVerificationOtp(otp);
		user.setVerificationOtpExpiresAt(Instant.now().plus(verificationOtpValidMinutes, ChronoUnit.MINUTES));
		userRepository.save(user);
		try {
			emailService.sendVerificationOtp(user.getEmail(), otp);
		}
		catch (Exception ex) {
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
					"Could not send verification OTP email. Please try again later.");
		}
		notifyUser(user.getEmail(), "A new verification OTP was sent to your email.", NotificationType.SYSTEM);
		return user.getEmail();
	}

	public MeProfileDto linkGoogle(String authenticatedEmail, String idToken) {
		if (!googleOAuthTokenService.isConfigured()) {
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
					"Google sign-in is not configured on this server");
		}
		User user = loadUser(authenticatedEmail);
		GoogleUserPayload payload = googleOAuthTokenService.verifyAndParse(idToken);
		if (!payload.email().equalsIgnoreCase(user.getEmail())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Google account email must match your account email to link it.");
		}
		userRepository.findByGoogleSub(payload.googleSub()).ifPresent(other -> {
			if (!other.getId().equals(user.getId())) {
				throw new ResponseStatusException(HttpStatus.CONFLICT,
						"This Google account is already linked to another user.");
			}
		});
		user.setGoogleSub(payload.googleSub());
		if (Boolean.FALSE.equals(user.getVerified())) {
			user.setVerified(true);
		}
		return toDto(userRepository.save(user));
	}

	public MeProfileDto unlinkGoogle(String authenticatedEmail) {
		User user = loadUser(authenticatedEmail);
		if (user.getGoogleSub() == null || user.getGoogleSub().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No Google account is linked");
		}
		if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Set a password before unlinking Google to avoid being locked out of your account.");
		}
		user.setGoogleSub(null);
		return toDto(userRepository.save(user));
	}

	public MeProfileDto updatePreferences(String authenticatedEmail, UserPreferencesDto patch) {
		User user = loadUser(authenticatedEmail);
		UserPreferences prefs = user.getPreferences() != null ? user.getPreferences() : new UserPreferences();
		applyPatch(prefs, patch);
		user.setPreferences(prefs);
		return toDto(userRepository.save(user));
	}

	public Map<String, Object> exportData(String authenticatedEmail) {
		User user = loadUser(authenticatedEmail);
		Map<String, Object> root = new LinkedHashMap<>();
		root.put("exportedAt", Instant.now().toString());
		root.put("profile", toDto(user));

		List<Booking> bookings = bookingRepository.findByUser_Id(user.getId());
		root.put("bookings", bookings);

		List<Incident> incidents = incidentRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
		root.put("incidents", incidents);
		return root;
	}

	public MeProfileDto requestDeletion(String authenticatedEmail) {
		User user = loadUser(authenticatedEmail);
		user.setDeletionRequested(true);
		User saved = userRepository.save(user);
		notifyUser(saved.getEmail(), "Your account deletion request was submitted for admin review.",
				NotificationType.SYSTEM);
		notifyAdmins("User " + safeName(saved) + " requested account deletion.", NotificationType.SYSTEM);
		return toDto(saved);
	}

	public MeProfileDto cancelDeletion(String authenticatedEmail) {
		User user = loadUser(authenticatedEmail);
		user.setDeletionRequested(false);
		User saved = userRepository.save(user);
		notifyUser(saved.getEmail(), "Your account deletion request was cancelled.", NotificationType.SYSTEM);
		return toDto(saved);
	}

	private User loadUser(String authenticatedEmail) {
		if (authenticatedEmail == null || authenticatedEmail.isBlank()) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
		}
		return userRepository.findByEmail(authenticatedEmail.trim().toLowerCase())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
						"Authenticated user not found in database"));
	}

	private MeProfileDto toDto(User user) {
		Role role = user.getRole() == null ? Role.STUDENT : user.getRole();
		boolean googleLinked = user.getGoogleSub() != null && !user.getGoogleSub().isBlank();
		boolean hasPassword = user.getPasswordHash() != null && !user.getPasswordHash().isBlank();
		UserPreferencesDto prefsDto = toDto(user.getPreferences() != null
				? user.getPreferences()
				: UserPreferences.withDefaults());
		return new MeProfileDto(
				user.getId(),
				user.getEmail(),
				user.getFullName(),
				role,
				user.getAvatarUrl(),
				user.getCreatedAt(),
				user.getLastLoginAt(),
				user.getVerified(),
				googleLinked,
				hasPassword,
				user.isDeletionRequested(),
				prefsDto);
	}

	private UserPreferencesDto toDto(UserPreferences src) {
		UserPreferencesDto dto = new UserPreferencesDto();
		dto.setEmailNotifications(src.isEmailNotifications());
		dto.setInAppNotifications(src.isInAppNotifications());
		dto.setNotifyBookings(src.isNotifyBookings());
		dto.setNotifyIncidents(src.isNotifyIncidents());
		dto.setNotifyAnnouncements(src.isNotifyAnnouncements());
		dto.setQuietHoursStart(src.getQuietHoursStart());
		dto.setQuietHoursEnd(src.getQuietHoursEnd());
		dto.setDefaultResourceCategory(src.getDefaultResourceCategory());
		dto.setDefaultBookingDurationMins(src.getDefaultBookingDurationMins());
		dto.setBookingViewMode(src.getBookingViewMode());
		dto.setDefaultIncidentCategory(src.getDefaultIncidentCategory());
		dto.setDefaultIncidentLocation(src.getDefaultIncidentLocation());
		dto.setShowOnlyMyIncidents(src.isShowOnlyMyIncidents());
		dto.setTheme(src.getTheme());
		dto.setLanguage(src.getLanguage());
		dto.setTimeZone(src.getTimeZone());
		dto.setItemsPerPage(src.getItemsPerPage());
		return dto;
	}

	private void applyPatch(UserPreferences target, UserPreferencesDto patch) {
		if (patch == null) {
			return;
		}
		if (patch.getEmailNotifications() != null) {
			target.setEmailNotifications(patch.getEmailNotifications());
		}
		if (patch.getInAppNotifications() != null) {
			target.setInAppNotifications(patch.getInAppNotifications());
		}
		if (patch.getNotifyBookings() != null) {
			target.setNotifyBookings(patch.getNotifyBookings());
		}
		if (patch.getNotifyIncidents() != null) {
			target.setNotifyIncidents(patch.getNotifyIncidents());
		}
		if (patch.getNotifyAnnouncements() != null) {
			target.setNotifyAnnouncements(patch.getNotifyAnnouncements());
		}
		if (patch.getQuietHoursStart() != null) {
			target.setQuietHoursStart(patch.getQuietHoursStart().isBlank() ? null : patch.getQuietHoursStart());
		}
		if (patch.getQuietHoursEnd() != null) {
			target.setQuietHoursEnd(patch.getQuietHoursEnd().isBlank() ? null : patch.getQuietHoursEnd());
		}
		if (patch.getDefaultResourceCategory() != null) {
			target.setDefaultResourceCategory(patch.getDefaultResourceCategory().isBlank()
					? null
					: patch.getDefaultResourceCategory().toUpperCase());
		}
		if (patch.getDefaultBookingDurationMins() != null) {
			int mins = patch.getDefaultBookingDurationMins();
			if (mins <= 0 || mins > 24 * 60) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
						"Default booking duration must be between 1 and 1440 minutes");
			}
			target.setDefaultBookingDurationMins(mins);
		}
		if (patch.getBookingViewMode() != null) {
			String mode = patch.getBookingViewMode().trim().toUpperCase();
			if (!mode.isEmpty() && !mode.equals("LIST") && !mode.equals("GRID")) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
						"Booking view mode must be LIST or GRID");
			}
			target.setBookingViewMode(mode.isEmpty() ? null : mode);
		}
		if (patch.getDefaultIncidentCategory() != null) {
			target.setDefaultIncidentCategory(patch.getDefaultIncidentCategory().isBlank()
					? null
					: patch.getDefaultIncidentCategory());
		}
		if (patch.getDefaultIncidentLocation() != null) {
			target.setDefaultIncidentLocation(patch.getDefaultIncidentLocation().isBlank()
					? null
					: patch.getDefaultIncidentLocation());
		}
		if (patch.getShowOnlyMyIncidents() != null) {
			target.setShowOnlyMyIncidents(patch.getShowOnlyMyIncidents());
		}
		if (patch.getTheme() != null) {
			String theme = patch.getTheme().trim().toUpperCase();
			if (!theme.isEmpty() && !theme.equals("LIGHT") && !theme.equals("DARK")) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
						"Theme must be LIGHT or DARK");
			}
			target.setTheme(theme.isEmpty() ? null : theme);
		}
		if (patch.getLanguage() != null) {
			target.setLanguage(patch.getLanguage().isBlank() ? null : patch.getLanguage());
		}
		if (patch.getTimeZone() != null) {
			target.setTimeZone(patch.getTimeZone().isBlank() ? null : patch.getTimeZone());
		}
		if (patch.getItemsPerPage() != null) {
			int n = patch.getItemsPerPage();
			if (n <= 0 || n > 200) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
						"Items per page must be between 1 and 200");
			}
			target.setItemsPerPage(n);
		}
	}

	@SuppressWarnings("unused")
	private static String randomBase64(int bytes) {
		byte[] buf = new byte[bytes];
		SECURE_RANDOM.nextBytes(buf);
		return Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
	}

	private void notifyAdmins(String message, NotificationType type) {
		for (User admin : userRepository.findByRole(Role.ADMIN)) {
			notifyUser(admin.getEmail(), message, type);
		}
	}

	private void notifyUser(String userEmail, String message, NotificationType type) {
		if (userEmail == null || userEmail.isBlank() || message == null || message.isBlank()) {
			return;
		}
		try {
			notificationService.createForUser(new CreateNotificationRequest(
					message,
					userEmail.trim().toLowerCase(),
					type));
		}
		catch (Exception ignored) {
			// Notification is best-effort and should not block user actions.
		}
	}

	private String safeName(User user) {
		if (user == null) {
			return "unknown user";
		}
		if (user.getFullName() != null && !user.getFullName().isBlank()) {
			return user.getFullName().trim();
		}
		return user.getEmail() == null ? "unknown user" : user.getEmail();
	}
}
