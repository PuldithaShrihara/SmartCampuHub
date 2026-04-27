package com.example.backend.incident.entity;

public enum IncidentStatus {
	// Backward-compatibility alias: older Mongo documents may store status as "PENDING".
	// We treat it as Open in UI/behavior.
	PENDING("Open"),
	OPEN("Open"),
	IN_PROGRESS("In Progress"),
	RESOLVED("Resolved"),
	CLOSED("Closed"),
	REJECTED("Rejected");

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
		String trimmed = raw.trim();
		// Backward compatibility for old pending values in existing data.
		if ("pending".equalsIgnoreCase(trimmed)) {
			return PENDING;
		}
		for (IncidentStatus status : values()) {
			if (status.value.equalsIgnoreCase(trimmed) || status.name().equalsIgnoreCase(trimmed)) {
				return status;
			}
		}
		throw new IllegalArgumentException("Invalid status");
	}

	public static boolean isOpenLike(IncidentStatus status) {
		return status == OPEN || status == PENDING;
	}
}
