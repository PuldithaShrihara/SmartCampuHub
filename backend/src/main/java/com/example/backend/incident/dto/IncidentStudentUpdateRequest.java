package com.example.backend.incident.dto;

public class IncidentStudentUpdateRequest {
	private String title;
	private String description;
	private String category;
	private String priority;
	private String resourceId;
	private String preferredContactName;
	private String preferredContactEmail;

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getResourceId() {
		return resourceId;
	}

	public void setResourceId(String resourceId) {
		this.resourceId = resourceId;
	}

	public String getCategory() {
		return category;
	}

	public void setCategory(String category) {
		this.category = category;
	}

	public String getPriority() {
		return priority;
	}

	public void setPriority(String priority) {
		this.priority = priority;
	}

	public String getPreferredContactName() {
		return preferredContactName;
	}

	public void setPreferredContactName(String preferredContactName) {
		this.preferredContactName = preferredContactName;
	}

	public String getPreferredContactEmail() {
		return preferredContactEmail;
	}

	public void setPreferredContactEmail(String preferredContactEmail) {
		this.preferredContactEmail = preferredContactEmail;
	}
}
