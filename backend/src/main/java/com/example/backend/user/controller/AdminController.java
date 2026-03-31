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
import com.example.backend.user.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin")
@Validated
public class AdminController {

	private final UserService userService;

	public AdminController(UserService userService) {
		this.userService = userService;
	}

	@PostMapping("/users/technician")
	@ResponseStatus(HttpStatus.CREATED)
	public UserSummaryDto createTechnician(@Valid @RequestBody CreateStaffUserRequest request) {
		return userService.createTechnicianByAdmin(request);
	}

	@GetMapping("/users/technicians")
	public List<UserSummaryDto> listTechnicians() {
		return userService.listTechnicians();
	}

}
