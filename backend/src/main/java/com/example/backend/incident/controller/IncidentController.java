package com.example.backend.incident.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.common.response.ApiResponse;
import com.example.backend.incident.dto.IncidentResponseDto;
import com.example.backend.incident.dto.IncidentStudentUpdateRequest;
import com.example.backend.incident.dto.IncidentUpdateRequest;
import com.example.backend.incident.service.IncidentService;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

	private final IncidentService incidentService;

	public IncidentController(IncidentService incidentService) {
		this.incidentService = incidentService;
	}

	@PostMapping(consumes = { "multipart/form-data" })
	public ResponseEntity<ApiResponse<IncidentResponseDto>> createIncident(
			@RequestParam("title") String title,
			@RequestParam("description") String description,
			@RequestParam("resourceId") String resourceId,
			@RequestParam(value = "file", required = false) MultipartFile file,
			@RequestParam(value = "attachment", required = false) MultipartFile attachment) {
		String email = authenticatedEmail();
		MultipartFile upload = file != null ? file : attachment;
		IncidentResponseDto data = incidentService.createIncident(title, description, resourceId, upload, email);
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(new ApiResponse<>(true, "Incident created successfully", data));
	}

	@GetMapping("/my")
	public ResponseEntity<ApiResponse<List<IncidentResponseDto>>> getMyIncidents() {
		String email = authenticatedEmail();
		List<IncidentResponseDto> data = incidentService.getMyIncidents(email);
		return ResponseEntity.ok(new ApiResponse<>(true, "My incidents fetched successfully", data));
	}

	@PutMapping("/my/{id}")
	public ResponseEntity<ApiResponse<IncidentResponseDto>> updateMyPendingIncident(
			@PathVariable("id") String id,
			@RequestBody IncidentStudentUpdateRequest request) {
		String email = authenticatedEmail();
		IncidentResponseDto data = incidentService.updateMyPendingIncident(id, request, email);
		return ResponseEntity.ok(new ApiResponse<>(true, "Incident updated successfully", data));
	}

	@DeleteMapping("/my/{id}")
	public ResponseEntity<ApiResponse<Object>> deleteMyPendingIncident(@PathVariable("id") String id) {
		String email = authenticatedEmail();
		incidentService.deleteMyPendingIncident(id, email);
		return ResponseEntity.ok(new ApiResponse<>(true, "Incident deleted successfully", null));
	}

	@GetMapping
	public ResponseEntity<ApiResponse<List<IncidentResponseDto>>> getAllIncidents(
			@RequestParam(value = "status", required = false) String status) {
		String email = authenticatedEmail();
		List<IncidentResponseDto> data = incidentService.getAllIncidents(status, email);
		return ResponseEntity.ok(new ApiResponse<>(true, "Incidents fetched successfully", data));
	}

	@PutMapping("/{id}")
	public ResponseEntity<ApiResponse<IncidentResponseDto>> updateIncident(
			@PathVariable("id") String id,
			@RequestBody IncidentUpdateRequest request) {
		String email = authenticatedEmail();
		IncidentResponseDto data = incidentService.updateIncident(id, request, email);
		return ResponseEntity.ok(new ApiResponse<>(true, "Incident updated successfully", data));
	}

	private String authenticatedEmail() {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		if (auth == null || auth.getPrincipal() == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
		}
		return auth.getPrincipal().toString();
	}
}
