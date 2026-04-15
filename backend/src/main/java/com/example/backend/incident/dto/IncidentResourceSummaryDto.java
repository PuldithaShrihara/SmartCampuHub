package com.example.backend.incident.dto;

public record IncidentResourceSummaryDto(
		String id,
		String name,
		String location,
		String type) {
}
