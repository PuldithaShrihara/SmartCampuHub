package com.example.backend.auth.service;

import java.time.Instant;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.auth.dto.AuthResponse;
import com.example.backend.auth.dto.StaffLoginRequest;
import com.example.backend.auth.dto.StaffLoginType;
import com.example.backend.auth.dto.StudentLoginRequest;
import com.example.backend.auth.dto.StudentRegisterRequest;
import com.example.backend.auth.dto.SuperadminLoginRequest;
import com.example.backend.security.JwtService;
import com.example.backend.user.entity.Role;
import com.example.backend.user.entity.User;
import com.example.backend.user.repository.UserRepository;

@Service
public class AuthService {

	private final UserRepository userRepository;

	private final PasswordEncoder passwordEncoder;

	private final JwtService jwtService;

	public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
	}

	public AuthResponse registerStudent(StudentRegisterRequest request) {
		if (!request.password().equals(request.confirmPassword())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Passwords do not match");
		}
		String email = request.email().trim().toLowerCase();
		if (userRepository.existsByEmailIgnoreCase(email)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
		}
		User user = new User();
		user.setEmail(email);
		user.setPasswordHash(passwordEncoder.encode(request.password()));
		user.setFullName(request.fullName().trim());
		user.setRole(Role.STUDENT);
		user.setCreatedAt(Instant.now());
		userRepository.save(user);
		return tokenFor(user);
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

}
