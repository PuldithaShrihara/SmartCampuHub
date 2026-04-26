package com.example.backend.user.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.auth.dto.CreateStaffUserRequest;
import com.example.backend.auth.dto.CreateUserByAdminRequest;
import com.example.backend.auth.dto.UserSummaryDto;
import com.example.backend.auth.service.UserManagementService;
import com.example.backend.common.response.ApiResponse;
import com.example.backend.user.dto.CreateTechnicianRequest;
import com.example.backend.user.entity.User;
import com.example.backend.user.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin")
@Validated
public class AdminController {

	private final UserService userService;
	private final UserManagementService userManagementService;

	public AdminController(UserService userService, UserManagementService userManagementService) {
		this.userService = userService;
		this.userManagementService = userManagementService;
	}

	@PostMapping("/users/technician")
	@ResponseStatus(HttpStatus.CREATED)
	public UserSummaryDto createTechnician(@Valid @RequestBody CreateStaffUserRequest request) {
		return userService.createTechnicianByAdmin(request);
	}

	@PostMapping("/users")
	@ResponseStatus(HttpStatus.CREATED)
	public UserSummaryDto createUser(@Valid @RequestBody CreateUserByAdminRequest request) {
		return userManagementService.createUserByAdmin(request);
	}

	@PostMapping("/technicians")
	public ResponseEntity<ApiResponse<User>> createTechnicianForAdmin(
			@Valid @RequestBody CreateTechnicianRequest request) {
		User user = userService.createTechnician(request);
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(new ApiResponse<>(true, "Technician added successfully", user));
	}

	@GetMapping("/users/technicians")
	public List<UserSummaryDto> listTechnicians() {
		return userService.listAvailableTechnicians();
	}

	@GetMapping("/users")
	public List<UserSummaryDto> listStudentsAndTechnicians() {
		return userManagementService.listStudentsAndTechnicians();
	}

	@DeleteMapping("/users/{id}/hard")
	public UserSummaryDto hardDeleteUser(@PathVariable("id") String userId) {
		return userManagementService.hardDeleteStudentOrTechnician(userId);
	}

}
