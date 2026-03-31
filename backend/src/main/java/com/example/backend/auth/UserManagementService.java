package com.example.backend.auth;

import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.auth.dto.CreateStaffUserRequest;
import com.example.backend.auth.dto.CreateUserByAdminRequest;
import com.example.backend.auth.dto.UserSummaryDto;
import com.example.backend.user.Role;
import com.example.backend.user.User;
import com.example.backend.user.UserRepository;

@Service
public class UserManagementService {

	private final UserRepository userRepository;

	private final PasswordEncoder passwordEncoder;

	public UserManagementService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
	}

	public UserSummaryDto createAdmin(CreateStaffUserRequest request) {
		return saveStaffUser(request, Role.ADMIN);
	}

	public UserSummaryDto createTechnicianBySuperadmin(CreateStaffUserRequest request) {
		return saveStaffUser(request, Role.TECHNICIAN);
	}

	public UserSummaryDto createTechnicianByAdmin(CreateStaffUserRequest request) {
		return saveStaffUser(request, Role.TECHNICIAN);
	}

	/**
	 * Admin can create STUDENT and TECHNICIAN accounts.
	 */
	public UserSummaryDto createUserByAdmin(CreateUserByAdminRequest request) {
		Role role = request.role();
		if (role != Role.STUDENT && role != Role.TECHNICIAN) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin can create only STUDENT or TECHNICIAN users");
		}

		String email = request.email().trim().toLowerCase();
		if (userRepository.existsByEmailIgnoreCase(email)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
		}

		User user = new User();
		user.setEmail(email);
		user.setPasswordHash(passwordEncoder.encode(request.password()));
		user.setFullName(request.fullName().trim());
		user.setRole(role);
		user.setCreatedAt(Instant.now());
		user.setVerified(true);
		user.setVerificationOtp(null);
		user.setVerificationOtpExpiresAt(null);
		userRepository.save(user);
		return toDto(user);
	}

	private UserSummaryDto saveStaffUser(CreateStaffUserRequest request, Role role) {
		String email = request.email().trim().toLowerCase();
		if (userRepository.existsByEmailIgnoreCase(email)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
		}
		User user = new User();
		user.setEmail(email);
		user.setPasswordHash(passwordEncoder.encode(request.password()));
		user.setFullName(request.fullName().trim());
		user.setRole(role);
		user.setCreatedAt(Instant.now());
		user.setVerified(true);
		user.setVerificationOtp(null);
		user.setVerificationOtpExpiresAt(null);
		userRepository.save(user);
		return toDto(user);
	}

	public java.util.List<UserSummaryDto> listAllUsers() {
		return userRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toDto).toList();
	}

	public java.util.List<UserSummaryDto> listTechnicians() {
		return userRepository.findByRole(Role.TECHNICIAN).stream().map(this::toDto).toList();
	}

	public List<UserSummaryDto> listStudentsAndTechnicians() {
		return userRepository.findByRoleIn(List.of(Role.STUDENT, Role.TECHNICIAN)).stream().map(this::toDto).toList();
	}

	/**
	 * Permanently deletes a STUDENT or TECHNICIAN account.
	 */
	public UserSummaryDto hardDeleteStudentOrTechnician(String userId) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
		Role role = user.getRole();
		if (role != Role.STUDENT && role != Role.TECHNICIAN) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin can hard delete only STUDENT or TECHNICIAN");
		}
		UserSummaryDto dto = toDto(user);
		userRepository.delete(user);
		return dto;
	}

	private UserSummaryDto toDto(User user) {
		return new UserSummaryDto(user.getId(), user.getEmail(), user.getFullName(), user.getRole(),
				user.getCreatedAt());
	}

}
