package com.example.backend.incident.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.example.backend.incident.dto.IncidentResponseDto;
import com.example.backend.incident.dto.IncidentStudentUpdateRequest;
import com.example.backend.incident.dto.IncidentUpdateRequest;

public interface IncidentService {
	IncidentResponseDto createIncident(String title, String description, String resourceId, MultipartFile file,
			String authenticatedEmail);

	List<IncidentResponseDto> getMyIncidents(String authenticatedEmail);

	IncidentResponseDto updateMyPendingIncident(String incidentId, IncidentStudentUpdateRequest request, String authenticatedEmail);

	void deleteMyPendingIncident(String incidentId, String authenticatedEmail);

	List<IncidentResponseDto> getAllIncidents(String status, String authenticatedEmail);

	IncidentResponseDto updateIncident(String incidentId, IncidentUpdateRequest request, String authenticatedEmail);

	IncidentResponseDto acceptAssignedIncident(String incidentId, String authenticatedEmail);

	IncidentResponseDto declineAssignedIncident(String incidentId, String authenticatedEmail);
}
