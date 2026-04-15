package com.example.backend.incident.dto;

public record IncidentUserSummaryDto(
		String id,
		String fullName,
		String email,
		String role) {
}
