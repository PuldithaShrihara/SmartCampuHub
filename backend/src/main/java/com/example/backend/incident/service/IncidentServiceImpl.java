package com.example.backend.incident.service;

import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.common.service.FileStorageService;
import com.example.backend.incident.dto.IncidentResourceSummaryDto;
import com.example.backend.incident.dto.IncidentResponseDto;
import com.example.backend.incident.dto.IncidentUpdateRequest;
import com.example.backend.incident.dto.IncidentUserSummaryDto;
import com.example.backend.incident.entity.Incident;
import com.example.backend.incident.entity.IncidentStatus;
import com.example.backend.incident.repository.IncidentRepository;
import com.example.backend.resource.entity.Resource;
import com.example.backend.resource.repository.ResourceRepository;
import com.example.backend.user.entity.Role;
import com.example.backend.user.entity.User;
import com.example.backend.user.repository.UserRepository;

@Service
public class IncidentServiceImpl implements IncidentService {

	private final IncidentRepository incidentRepository;
	private final UserRepository userRepository;
	private final ResourceRepository resourceRepository;
	private final FileStorageService fileStorageService;

	public IncidentServiceImpl(
			IncidentRepository incidentRepository,
			UserRepository userRepository,
			ResourceRepository resourceRepository,
			FileStorageService fileStorageService) {
		this.incidentRepository = incidentRepository;
		this.userRepository = userRepository;
		this.resourceRepository = resourceRepository;
		this.fileStorageService = fileStorageService;
	}

	@Override
	public IncidentResponseDto createIncident(String title, String description, String resourceId, MultipartFile file,
			String authenticatedEmail) {
		User currentUser = requireCurrentUser(authenticatedEmail);
		requireUserRole(currentUser);

		if (isBlank(title) || isBlank(description) || isBlank(resourceId)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "title, description, and resourceId are required");
		}

		resourceRepository.findById(resourceId.trim())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid resourceId"));

		Incident incident = new Incident();
		incident.setTitle(title.trim());
		incident.setDescription(description.trim());
		incident.setResourceId(resourceId.trim());
		incident.setUserId(currentUser.getId());
		incident.setStatus(IncidentStatus.PENDING);
		incident.setTechnicianRemarks("");
		incident.setCreatedAt(Instant.now());

		if (file != null && !file.isEmpty()) {
			validateAttachment(file);
			incident.setAttachmentPath(fileStorageService.storeFile(file, "incidents"));
		}

		Incident savedIncident = incidentRepository.save(incident);
		return toIncidentData(savedIncident, false, true, false);
	}

	@Override
	public List<IncidentResponseDto> getMyIncidents(String authenticatedEmail) {
		User currentUser = requireCurrentUser(authenticatedEmail);
		requireUserRole(currentUser);

		return incidentRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId())
				.stream()
				.map(incident -> toIncidentData(incident, false, true, false))
				.toList();
	}

	@Override
	public List<IncidentResponseDto> getAllIncidents(String status, String authenticatedEmail) {
		User currentUser = requireCurrentUser(authenticatedEmail);
		requireTechnicianOrAdmin(currentUser);

		List<Incident> incidents;
		if (!isBlank(status)) {
			incidents = incidentRepository.findByStatusOrderByCreatedAtDesc(parseStatus(status));
		} else {
			incidents = incidentRepository.findAllByOrderByCreatedAtDesc();
		}

		return incidents.stream()
				.map(incident -> toIncidentData(incident, true, true, true))
				.toList();
	}

	@Override
	public IncidentResponseDto updateIncident(String incidentId, IncidentUpdateRequest request, String authenticatedEmail) {
		User currentUser = requireCurrentUser(authenticatedEmail);
		requireTechnicianOrAdmin(currentUser);

		Incident incident = incidentRepository.findById(incidentId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Incident not found"));

		if (request.getStatus() != null) {
			incident.setStatus(parseStatus(request.getStatus()));
		}
		if (request.getTechnicianRemarks() != null) {
			incident.setTechnicianRemarks(request.getTechnicianRemarks().trim());
		}
		if (request.getAssignedTo() != null) {
			String assignedTo = request.getAssignedTo().trim();
			if (!assignedTo.isEmpty()) {
				userRepository.findById(assignedTo)
						.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid assignedTo user id"));
				incident.setAssignedTo(assignedTo);
			} else {
				incident.setAssignedTo(null);
			}
		}

		Incident saved = incidentRepository.save(incident);
		return toIncidentData(saved, true, true, true);
	}

	private User requireCurrentUser(String authenticatedEmail) {
		if (isBlank(authenticatedEmail)) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
		}
		return userRepository.findByEmail(authenticatedEmail)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
	}

	// "USER" in requirement maps to STUDENT in this project roles.
	private void requireUserRole(User user) {
		if (user.getRole() != Role.STUDENT) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
		}
	}

	private void requireTechnicianOrAdmin(User user) {
		if (user.getRole() != Role.TECHNICIAN && user.getRole() != Role.ADMIN) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
		}
	}

	private IncidentStatus parseStatus(String raw) {
		try {
			return IncidentStatus.fromValue(raw);
		} catch (Exception ex) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Invalid status. Allowed values: Pending, In Progress, Resolved");
		}
	}

	private void validateAttachment(MultipartFile file) {
		String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
		boolean allowed = contentType.equals("application/pdf")
				|| contentType.equals("image/jpeg")
				|| contentType.equals("image/png")
				|| contentType.equals("image/webp")
				|| contentType.equals("image/gif");
		if (!allowed) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only image and PDF files are allowed");
		}
	}

	private IncidentResponseDto toIncidentData(Incident incident, boolean includeUser, boolean includeResource,
			boolean includeAssignedTo) {
		Object resourceData = includeResource
				? resourceRepository.findById(incident.getResourceId()).map(this::resourceSummary).orElse(null)
				: incident.getResourceId();
		Object userData = includeUser
				? userRepository.findById(incident.getUserId()).map(this::userSummary).orElse(null)
				: incident.getUserId();
		Object assignedToData = includeAssignedTo
				? (incident.getAssignedTo() == null
						? null
						: userRepository.findById(incident.getAssignedTo()).map(this::userSummary).orElse(null))
				: incident.getAssignedTo();

		return new IncidentResponseDto(
				incident.getId(),
				incident.getTitle(),
				incident.getDescription(),
				incident.getStatus() == null ? null : incident.getStatus().getValue(),
				incident.getAttachmentPath(),
				incident.getTechnicianRemarks(),
				incident.getCreatedAt(),
				resourceData,
				userData,
				assignedToData);
	}

	private IncidentUserSummaryDto userSummary(User user) {
		return new IncidentUserSummaryDto(
				user.getId(),
				user.getFullName(),
				user.getEmail(),
				user.getRole().name());
	}

	private IncidentResourceSummaryDto resourceSummary(Resource resource) {
		return new IncidentResourceSummaryDto(
				resource.getId(),
				resource.getName(),
				resource.getLocation(),
				resource.getType() == null ? null : resource.getType().name());
	}

	private boolean isBlank(String value) {
		return value == null || value.isBlank();
	}
}
