package com.example.backend.incident.dto;

import java.time.Instant;
import java.util.List;

public record IncidentResponseDto(
		String id,
		String title,
		String description,
		String category,
		String priority,
		String preferredContactName,
		String preferredContactEmail,
		String status,
		String assignmentStatus,
		String attachmentPath,
		List<String> attachmentPaths,
		String rejectionReason,
		String technicianRemarks,
		Instant createdAt,
		Object resourceId,
		Object userId,
		Object assignedTo) {
}
