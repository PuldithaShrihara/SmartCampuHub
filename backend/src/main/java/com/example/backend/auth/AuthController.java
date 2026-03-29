package com.example.backend.auth;

import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.auth.dto.StaffLoginRequest;
import com.example.backend.auth.dto.StudentLoginRequest;
import com.example.backend.auth.dto.StudentRegisterRequest;
import com.example.backend.auth.dto.SuperadminLoginRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@Validated
public class AuthController {

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping("/student/register")
	@ResponseStatus(HttpStatus.CREATED)
	public AuthResponse registerStudent(@Valid @RequestBody StudentRegisterRequest request) {
		return authService.registerStudent(request);
	}

	@PostMapping("/student/login")
	public AuthResponse loginStudent(@Valid @RequestBody StudentLoginRequest request) {
		return authService.loginStudent(request);
	}

	@PostMapping("/superadmin/login")
	public AuthResponse loginSuperadmin(@Valid @RequestBody SuperadminLoginRequest request) {
		return authService.loginSuperadmin(request);
	}

	@PostMapping("/staff/login")
	public AuthResponse loginStaff(@Valid @RequestBody StaffLoginRequest request) {
		return authService.loginStaff(request);
	}

}
