package com.example.backend.auth.service;

import java.time.Instant;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.auth.dto.CreateStaffUserRequest;
import com.example.backend.auth.dto.UserSummaryDto;
import com.example.backend.user.entity.Role;
import com.example.backend.user.entity.User;
import com.example.backend.user.repository.UserRepository;

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
		userRepository.save(user);
		return toDto(user);
	}

	public java.util.List<UserSummaryDto> listAllUsers() {
		return userRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toDto).toList();
	}

	public java.util.List<UserSummaryDto> listTechnicians() {
		return userRepository.findByRole(Role.TECHNICIAN).stream().map(this::toDto).toList();
	}

	private UserSummaryDto toDto(User user) {
		return new UserSummaryDto(user.getId(), user.getEmail(), user.getFullName(), user.getRole(),
				user.getCreatedAt());
	}

}
