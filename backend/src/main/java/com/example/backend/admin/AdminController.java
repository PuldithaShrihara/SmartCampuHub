package com.example.backend.admin;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.auth.UserManagementService;
import com.example.backend.auth.dto.CreateStaffUserRequest;
import com.example.backend.auth.dto.CreateUserByAdminRequest;
import com.example.backend.auth.dto.UserSummaryDto;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin")
@Validated
public class AdminController {

	private final UserManagementService userManagementService;

	public AdminController(UserManagementService userManagementService) {
		this.userManagementService = userManagementService;
	}

	@PostMapping("/users/technician")
	@ResponseStatus(HttpStatus.CREATED)
	public UserSummaryDto createTechnician(@Valid @RequestBody CreateStaffUserRequest request) {
		return userManagementService.createTechnicianByAdmin(request);
	}

	@PostMapping("/users")
	@ResponseStatus(HttpStatus.CREATED)
	public UserSummaryDto createUser(@Valid @RequestBody CreateUserByAdminRequest request) {
		return userManagementService.createUserByAdmin(request);
	}

	@GetMapping("/users/technicians")
	public List<UserSummaryDto> listTechnicians() {
		return userManagementService.listTechnicians();
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
