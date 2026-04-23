package com.example.backend.incident.entity;

public enum IncidentAssignmentStatus {
	UNASSIGNED("Unassigned"),
	ASSIGNED("Assigned"),
	ACCEPTED("Accepted"),
	DECLINED("Declined");

	private final String value;

	IncidentAssignmentStatus(String value) {
		this.value = value;
	}

	public String getValue() {
		return value;
	}
}
