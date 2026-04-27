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
import com.example.backend.incident.dto.IncidentCommentRequest;
import com.example.backend.incident.dto.IncidentCommentResponseDto;
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
			@RequestParam("category") String category,
			@RequestParam("priority") String priority,
			@RequestParam("resourceId") String resourceId,
			@RequestParam("preferredContactName") String preferredContactName,
			@RequestParam("preferredContactEmail") String preferredContactEmail,
			@RequestParam(value = "files", required = false) List<MultipartFile> files,
			@RequestParam(value = "file", required = false) MultipartFile file,
			@RequestParam(value = "attachment", required = false) MultipartFile attachment,
			@RequestParam(value = "attachments", required = false) List<MultipartFile> attachments) {
		// Frontend link: StudentIncidentsPage -> incidentApi.createIncident() -> POST /api/incidents.
		// Read logged-in user from JWT context; frontend token decides who is creating.
		String email = authenticatedEmail();
		// Support legacy and newer parameter names for compatibility with different frontend payloads.
		List<MultipartFile> uploads = files;
		if (uploads == null || uploads.isEmpty()) uploads = attachments;
		if ((uploads == null || uploads.isEmpty()) && file != null) uploads = List.of(file);
		if ((uploads == null || uploads.isEmpty()) && attachment != null) uploads = List.of(attachment);
		IncidentResponseDto data = incidentService.createIncident(
				title,
				description,
				category,
				priority,
				resourceId,
				preferredContactName,
				preferredContactEmail,
				uploads == null ? List.of() : uploads,
				email);
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(new ApiResponse<>(true, "Incident created successfully", data));
	}

	@GetMapping("/my")
	public ResponseEntity<ApiResponse<List<IncidentResponseDto>>> getMyIncidents() {
		// Frontend link: StudentIncidentsPage -> incidentApi.getMyIncidents() -> GET /api/incidents/my.
		// Returns incidents belonging to current authenticated user only.
		String email = authenticatedEmail();
		List<IncidentResponseDto> data = incidentService.getMyIncidents(email);
		return ResponseEntity.ok(new ApiResponse<>(true, "My incidents fetched successfully", data));
	}

	@PutMapping("/my/{id}")
	public ResponseEntity<ApiResponse<IncidentResponseDto>> updateMyPendingIncident(
			@PathVariable("id") String id,
			@RequestBody IncidentStudentUpdateRequest request) {
		// Frontend link: StudentIncidentsPage edit flow -> incidentApi.updateMyIncident().
		String email = authenticatedEmail();
		IncidentResponseDto data = incidentService.updateMyPendingIncident(id, request, email);
		return ResponseEntity.ok(new ApiResponse<>(true, "Incident updated successfully", data));
	}

	@DeleteMapping("/my/{id}")
	public ResponseEntity<ApiResponse<Object>> deleteMyPendingIncident(@PathVariable("id") String id) {
		// Frontend link: StudentIncidentsPage delete action -> incidentApi.deleteMyIncident().
		String email = authenticatedEmail();
		incidentService.deleteMyPendingIncident(id, email);
		return ResponseEntity.ok(new ApiResponse<>(true, "Incident deleted successfully", null));
	}

	@GetMapping
	public ResponseEntity<ApiResponse<List<IncidentResponseDto>>> getAllIncidents(
			@RequestParam(value = "status", required = false) String status) {
		// Frontend link: TicketsPage / TechnicianTicketsPage -> incidentApi.getAllIncidents().
		// Used by admin/technician flows; service applies role-based filtering/authorization.
		String email = authenticatedEmail();
		List<IncidentResponseDto> data = incidentService.getAllIncidents(status, email);
		return ResponseEntity.ok(new ApiResponse<>(true, "Incidents fetched successfully", data));
	}

	@PutMapping("/{id}")
	public ResponseEntity<ApiResponse<IncidentResponseDto>> updateIncident(
			@PathVariable("id") String id,
			@RequestBody IncidentUpdateRequest request) {
		// Frontend link: TicketsPage / TechnicianTicketsPage -> incidentApi.updateIncident().
		// Central update endpoint for status updates, technician remarks, and assignment changes.
		String email = authenticatedEmail();
		IncidentResponseDto data = incidentService.updateIncident(id, request, email);
		return ResponseEntity.ok(new ApiResponse<>(true, "Incident updated successfully", data));
	}

	@PostMapping("/{id}/accept")
	public ResponseEntity<ApiResponse<IncidentResponseDto>> acceptIncident(@PathVariable("id") String id) {
		// Frontend link: TechnicianTicketsPage -> incidentApi.acceptIncidentAssignment().
		String email = authenticatedEmail();
		IncidentResponseDto data = incidentService.acceptAssignedIncident(id, email);
		return ResponseEntity.ok(new ApiResponse<>(true, "Incident assignment accepted", data));
	}

	@PostMapping("/{id}/decline")
	public ResponseEntity<ApiResponse<IncidentResponseDto>> declineIncident(@PathVariable("id") String id) {
		// Frontend link: TechnicianTicketsPage -> incidentApi.declineIncidentAssignment().
		String email = authenticatedEmail();
		IncidentResponseDto data = incidentService.declineAssignedIncident(id, email);
		return ResponseEntity.ok(new ApiResponse<>(true, "Incident assignment declined", data));
	}

	@GetMapping("/{id}/comments")
	public ResponseEntity<ApiResponse<List<IncidentCommentResponseDto>>> getIncidentComments(@PathVariable("id") String id) {
		String email = authenticatedEmail();
		List<IncidentCommentResponseDto> data = incidentService.listComments(id, email);
		return ResponseEntity.ok(new ApiResponse<>(true, "Incident comments fetched successfully", data));
	}

	@PostMapping("/{id}/comments")
	public ResponseEntity<ApiResponse<IncidentCommentResponseDto>> addIncidentComment(
			@PathVariable("id") String id,
			@RequestBody IncidentCommentRequest request) {
		String email = authenticatedEmail();
		IncidentCommentResponseDto data = incidentService.addComment(id, request, email);
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(new ApiResponse<>(true, "Incident comment added successfully", data));
	}

	@PutMapping("/{id}/comments/{commentId}")
	public ResponseEntity<ApiResponse<IncidentCommentResponseDto>> updateIncidentComment(
			@PathVariable("id") String id,
			@PathVariable("commentId") String commentId,
			@RequestBody IncidentCommentRequest request) {
		String email = authenticatedEmail();
		IncidentCommentResponseDto data = incidentService.updateComment(id, commentId, request, email);
		return ResponseEntity.ok(new ApiResponse<>(true, "Incident comment updated successfully", data));
	}

	@DeleteMapping("/{id}/comments/{commentId}")
	public ResponseEntity<ApiResponse<Object>> deleteIncidentComment(
			@PathVariable("id") String id,
			@PathVariable("commentId") String commentId) {
		String email = authenticatedEmail();
		incidentService.deleteComment(id, commentId, email);
		return ResponseEntity.ok(new ApiResponse<>(true, "Incident comment deleted successfully", null));
	}

	private String authenticatedEmail() {
		// Shared helper: all protected endpoints use this to identify the caller from security context.
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		if (auth == null || auth.getPrincipal() == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
		}
		return auth.getPrincipal().toString();
	}
}
