package com.example.backend.incident.entity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "incidents")
public class Incident {

	@Id
	private String id;

	private String title;
	private String description;
	private String category;
	private String priority;
	private String resourceId;
	private String userId;
	private String preferredContactName;
	private String preferredContactEmail;
	private IncidentStatus status = IncidentStatus.OPEN;
	private String attachmentPath;
	private List<String> attachmentPaths = new ArrayList<>();
	private String rejectionReason = "";
	private String technicianRemarks = "";
	private String assignedTo;
	private String assignedBy;
	private IncidentAssignmentStatus assignmentStatus = IncidentAssignmentStatus.UNASSIGNED;
	private Instant createdAt = Instant.now();

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

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

	public String getResourceId() {
		return resourceId;
	}

	public void setResourceId(String resourceId) {
		this.resourceId = resourceId;
	}

	public String getUserId() {
		return userId;
	}

	public void setUserId(String userId) {
		this.userId = userId;
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

	public IncidentStatus getStatus() {
		return status;
	}

	public void setStatus(IncidentStatus status) {
		this.status = status;
	}

	public String getAttachmentPath() {
		return attachmentPath;
	}

	public void setAttachmentPath(String attachmentPath) {
		this.attachmentPath = attachmentPath;
	}

	public List<String> getAttachmentPaths() {
		return attachmentPaths;
	}

	public void setAttachmentPaths(List<String> attachmentPaths) {
		this.attachmentPaths = attachmentPaths == null ? new ArrayList<>() : attachmentPaths;
	}

	public String getRejectionReason() {
		return rejectionReason;
	}

	public void setRejectionReason(String rejectionReason) {
		this.rejectionReason = rejectionReason;
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

	public String getAssignedBy() {
		return assignedBy;
	}

	public void setAssignedBy(String assignedBy) {
		this.assignedBy = assignedBy;
	}

	public IncidentAssignmentStatus getAssignmentStatus() {
		return assignmentStatus;
	}

	public void setAssignmentStatus(IncidentAssignmentStatus assignmentStatus) {
		this.assignmentStatus = assignmentStatus;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}
}
