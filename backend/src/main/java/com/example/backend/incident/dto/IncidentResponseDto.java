package com.example.backend.incident.dto;

import java.time.Instant;

public record IncidentResponseDto(
		String id,
		String title,
		String description,
		String status,
		String attachmentPath,
		String technicianRemarks,
		Instant createdAt,
		Object resourceId,
		Object userId,
		Object assignedTo) {
}
