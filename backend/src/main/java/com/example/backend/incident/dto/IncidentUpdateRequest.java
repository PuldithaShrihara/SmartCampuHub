package com.example.backend.incident.dto;

public class IncidentUpdateRequest {
	private String status;
	private String technicianRemarks;
	private String assignedTo;

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getTechnicianRemarks() {
		return technicianRemarks;
	}

	public void setTechnicianRemarks(String technicianRemarks) {
		this.technicianRemarks = technicianRemarks;
	}

	public String getAssignedTo() {
		return assignedTo;
	}

	public void setAssignedTo(String assignedTo) {
		this.assignedTo = assignedTo;
	}
}
