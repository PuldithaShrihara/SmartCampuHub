package com.example.backend.user.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.auth.dto.CreateStaffUserRequest;
import com.example.backend.auth.dto.UserSummaryDto;
import com.example.backend.auth.service.UserManagementService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/superadmin")
@Validated
public class SuperadminController {

	private final UserManagementService userManagementService;

	public SuperadminController(UserManagementService userManagementService) {
		this.userManagementService = userManagementService;
	}

	@PostMapping("/users/admin")
	@ResponseStatus(HttpStatus.CREATED)
	public UserSummaryDto createAdmin(@Valid @RequestBody CreateStaffUserRequest request) {
		return userManagementService.createAdmin(request);
	}

	@PostMapping("/users/technician")
	@ResponseStatus(HttpStatus.CREATED)
	public UserSummaryDto createTechnician(@Valid @RequestBody CreateStaffUserRequest request) {
		return userManagementService.createTechnicianBySuperadmin(request);
	}

	@GetMapping("/users")
	public List<UserSummaryDto> listUsers() {
		return userManagementService.listAllUsers();
	}

}
