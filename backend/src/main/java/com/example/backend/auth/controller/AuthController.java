package com.example.backend.auth.controller;

import java.util.Collections;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.auth.dto.AuthResponse;
import com.example.backend.auth.dto.EmailVerificationResponse;
import com.example.backend.auth.dto.ForgotPasswordResetRequest;
import com.example.backend.auth.dto.ForgotPasswordSendOtpRequest;
import com.example.backend.auth.dto.ForgotPasswordVerifyOtpRequest;
import com.example.backend.auth.dto.ResendVerificationRequest;
import com.example.backend.auth.dto.StaffLoginRequest;
import com.example.backend.auth.dto.StudentGoogleLoginRequest;
import com.example.backend.auth.dto.StudentLoginRequest;
import com.example.backend.auth.dto.StudentRegisterRequest;
import com.example.backend.auth.dto.StudentRegistrationResponse;
import com.example.backend.auth.dto.SuperadminLoginRequest;
import com.example.backend.auth.dto.VerifyOtpRequest;
import com.example.backend.auth.service.AuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@Validated
public class AuthController {

	private final AuthService authService;

	@Value("${app.google.oauth.client-id:}")
	private String googleOAuthClientId;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	/**
	 * Public Web client ID for Sign in with Google (same value embedded in the SPA).
	 */
	@GetMapping("/public/oauth-config")
	public Map<String, String> publicOAuthConfig() {
		String id = googleOAuthClientId == null ? "" : googleOAuthClientId.trim();
		return Collections.singletonMap("googleClientId", id);
	}

	@PostMapping("/student/register")
	@ResponseStatus(HttpStatus.CREATED)
	public StudentRegistrationResponse registerStudent(@Valid @RequestBody StudentRegisterRequest request) {
		return authService.registerStudent(request);
	}

	@PostMapping("/student/resend-verification")
	public StudentRegistrationResponse resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
		return authService.resendStudentVerification(request.email());
	}

	@PostMapping("/verify-otp")
	public EmailVerificationResponse verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
		return authService.verifyOtp(request.email(), request.otp());
	}

	@PostMapping("/forgot-password/send-otp")
	public StudentRegistrationResponse sendForgotPasswordOtp(@Valid @RequestBody ForgotPasswordSendOtpRequest request) {
		return authService.sendForgotPasswordOtp(request.email());
	}

	@PostMapping("/forgot-password/verify-otp")
	public EmailVerificationResponse verifyForgotPasswordOtp(@Valid @RequestBody ForgotPasswordVerifyOtpRequest request) {
		return authService.verifyForgotPasswordOtp(request.email(), request.otp());
	}

	@PostMapping("/forgot-password/reset")
	public StudentRegistrationResponse resetForgotPassword(@Valid @RequestBody ForgotPasswordResetRequest request) {
		return authService.resetPasswordWithOtp(request);
	}

	@PostMapping("/student/login")
	public AuthResponse loginStudent(@Valid @RequestBody StudentLoginRequest request) {
		return authService.loginStudent(request);
	}

	@PostMapping("/student/google")
	public AuthResponse loginStudentWithGoogle(@Valid @RequestBody StudentGoogleLoginRequest request) {
		return authService.loginStudentWithGoogle(request);
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
