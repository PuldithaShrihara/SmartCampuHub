package com.example.backend.incident.dto;

import java.time.Instant;

public record IncidentCommentResponseDto(
		String id,
		String incidentId,
		String authorUserId,
		String authorName,
		String authorRole,
		String message,
		Instant createdAt,
		Instant updatedAt,
		boolean canEdit,
		boolean canDelete) {
}
