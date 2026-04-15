package com.example.backend.incident.entity;

public enum IncidentStatus {
	PENDING("Pending"),
	IN_PROGRESS("In Progress"),
	RESOLVED("Resolved");

	private final String value;

	IncidentStatus(String value) {
		this.value = value;
	}

	public String getValue() {
		return value;
	}

	public static IncidentStatus fromValue(String raw) {
		if (raw == null) {
			return null;
		}
		for (IncidentStatus status : values()) {
			if (status.value.equalsIgnoreCase(raw.trim())) {
				return status;
			}
		}
		throw new IllegalArgumentException("Invalid status");
	}
}
