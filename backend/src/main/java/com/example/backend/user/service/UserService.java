package com.example.backend.user.service;

import java.time.Instant;
import java.util.List;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.backend.auth.dto.CreateStaffUserRequest;
import com.example.backend.auth.dto.UserSummaryDto;
import com.example.backend.auth.service.UserManagementService;
import com.example.backend.incident.entity.IncidentStatus;
import com.example.backend.incident.repository.IncidentRepository;
import com.example.backend.user.dto.CreateTechnicianRequest;
import com.example.backend.user.entity.Role;
import com.example.backend.user.entity.User;
import com.example.backend.user.repository.UserRepository;

@Service
public class UserService {

	private final UserManagementService userManagementService;
	private final UserRepository userRepository;
	private final IncidentRepository incidentRepository;
	private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

	public UserService(
			UserManagementService userManagementService,
			UserRepository userRepository,
			IncidentRepository incidentRepository) {
		this.userManagementService = userManagementService;
		this.userRepository = userRepository;
		this.incidentRepository = incidentRepository;
	}

	public UserSummaryDto createTechnicianByAdmin(CreateStaffUserRequest request) {
		return userManagementService.createTechnicianByAdmin(request);
	}

	public List<UserSummaryDto> listTechnicians() {
		return userManagementService.listTechnicians();
	}

	public List<UserSummaryDto> listAvailableTechnicians() {
		return userManagementService.listTechnicians()
				.stream()
				.filter(tech -> !incidentRepository.existsByAssignedToAndStatusNot(tech.id(), IncidentStatus.RESOLVED))
				.toList();
	}

	public User createTechnician(CreateTechnicianRequest request) {
		if (request == null
				|| request.getName() == null || request.getName().isBlank()
				|| request.getEmail() == null || request.getEmail().isBlank()
				|| request.getPassword() == null || request.getPassword().isBlank()) {
			throw new RuntimeException("Invalid request");
		}

		if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
			throw new RuntimeException("Email already exists");
		}

		User user = new User();
		user.setFullName(request.getName().trim());
		user.setEmail(request.getEmail().trim().toLowerCase());
		user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
		user.setRole(Role.TECHNICIAN);
		user.setCreatedAt(Instant.now());
		user.setVerified(true);

		return userRepository.save(user);
	}

}
