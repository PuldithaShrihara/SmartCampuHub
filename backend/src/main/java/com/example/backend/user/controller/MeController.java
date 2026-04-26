package com.example.backend.user.controller;

import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.common.response.ApiResponse;
import com.example.backend.user.dto.me.ChangePasswordRequest;
import com.example.backend.user.dto.me.GoogleLinkRequest;
import com.example.backend.user.dto.me.MeProfileDto;
import com.example.backend.user.dto.me.UpdateProfileRequest;
import com.example.backend.user.dto.me.UserPreferencesDto;
import com.example.backend.user.service.MeService;

import jakarta.validation.Valid;

/**
 * Self-service endpoints for the currently authenticated user. Used by the Student Settings
 * page (and reused by other roles since profile/preferences apply universally).
 */
@RestController
@RequestMapping("/api/me")
public class MeController {

	private final MeService meService;

	public MeController(MeService meService) {
		this.meService = meService;
	}

	@GetMapping
	public ResponseEntity<ApiResponse<MeProfileDto>> getProfile() {
		MeProfileDto data = meService.getProfile(authenticatedEmail());
		return ResponseEntity.ok(new ApiResponse<>(true, "Profile fetched successfully", data));
	}

	@PatchMapping("/profile")
	public ResponseEntity<ApiResponse<MeProfileDto>> updateProfile(
			@Valid @RequestBody UpdateProfileRequest request) {
		MeProfileDto data = meService.updateProfile(authenticatedEmail(), request);
		return ResponseEntity.ok(new ApiResponse<>(true, "Profile updated successfully", data));
	}

	@PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<ApiResponse<MeProfileDto>> uploadAvatar(
			@RequestParam("file") MultipartFile file) {
		MeProfileDto data = meService.uploadAvatar(authenticatedEmail(), file);
		return ResponseEntity.ok(new ApiResponse<>(true, "Avatar updated successfully", data));
	}

	@PostMapping("/password/change")
	public ResponseEntity<ApiResponse<Object>> changePassword(
			@Valid @RequestBody ChangePasswordRequest request) {
		meService.changePassword(authenticatedEmail(), request);
		return ResponseEntity.ok(new ApiResponse<>(true, "Password changed successfully", null));
	}

	@PostMapping("/email/resend-verification")
	public ResponseEntity<ApiResponse<Map<String, String>>> resendVerification() {
		String email = meService.resendVerification(authenticatedEmail());
		return ResponseEntity.ok(new ApiResponse<>(true,
				"A new verification OTP has been sent. Check your inbox.",
				Map.of("email", email)));
	}

	@PostMapping("/google/link")
	public ResponseEntity<ApiResponse<MeProfileDto>> linkGoogle(
			@Valid @RequestBody GoogleLinkRequest request) {
		MeProfileDto data = meService.linkGoogle(authenticatedEmail(), request.getIdToken());
		return ResponseEntity.ok(new ApiResponse<>(true, "Google account linked", data));
	}

	@DeleteMapping("/google/unlink")
	public ResponseEntity<ApiResponse<MeProfileDto>> unlinkGoogle() {
		MeProfileDto data = meService.unlinkGoogle(authenticatedEmail());
		return ResponseEntity.ok(new ApiResponse<>(true, "Google account unlinked", data));
	}

	@PatchMapping("/preferences")
	public ResponseEntity<ApiResponse<MeProfileDto>> updatePreferences(
			@RequestBody UserPreferencesDto patch) {
		MeProfileDto data = meService.updatePreferences(authenticatedEmail(), patch);
		return ResponseEntity.ok(new ApiResponse<>(true, "Preferences updated successfully", data));
	}

	@GetMapping("/export")
	public ResponseEntity<Map<String, Object>> exportData() {
		Map<String, Object> payload = meService.exportData(authenticatedEmail());
		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION,
						"attachment; filename=\"smartcampus-data-export.json\"")
				.contentType(MediaType.APPLICATION_JSON)
				.body(payload);
	}

	@PostMapping("/delete-request")
	public ResponseEntity<ApiResponse<MeProfileDto>> requestDeletion() {
		MeProfileDto data = meService.requestDeletion(authenticatedEmail());
		return ResponseEntity.ok(new ApiResponse<>(true,
				"Account deletion requested. An administrator will review your request.", data));
	}

	@DeleteMapping("/delete-request")
	public ResponseEntity<ApiResponse<MeProfileDto>> cancelDeletionRequest() {
		MeProfileDto data = meService.cancelDeletion(authenticatedEmail());
		return ResponseEntity.ok(new ApiResponse<>(true, "Deletion request cancelled", data));
	}

	private String authenticatedEmail() {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		if (auth == null || auth.getPrincipal() == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
		}
		return auth.getPrincipal().toString();
	}
}
