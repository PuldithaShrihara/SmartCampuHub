package com.example.backend.incident.service;

import java.time.Instant;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.common.service.FileStorageService;
import com.example.backend.incident.dto.IncidentResourceSummaryDto;
import com.example.backend.incident.dto.IncidentResponseDto;
import com.example.backend.incident.dto.IncidentStudentUpdateRequest;
import com.example.backend.incident.dto.IncidentUpdateRequest;
import com.example.backend.incident.dto.IncidentUserSummaryDto;
import com.example.backend.incident.entity.IncidentAssignmentStatus;
import com.example.backend.incident.entity.Incident;
import com.example.backend.incident.entity.IncidentStatus;
import com.example.backend.incident.repository.IncidentRepository;
import com.example.backend.notifications.NotificationService;
import com.example.backend.notifications.NotificationType;
import com.example.backend.notifications.dto.CreateNotificationRequest;
import com.example.backend.resource.entity.Resource;
import com.example.backend.resource.repository.ResourceRepository;
import com.example.backend.user.entity.Role;
import com.example.backend.user.entity.User;
import com.example.backend.user.repository.UserRepository;

@Service
public class IncidentServiceImpl implements IncidentService {

	private static final Logger log = LoggerFactory.getLogger(IncidentServiceImpl.class);

	private final IncidentRepository incidentRepository;
	private final UserRepository userRepository;
	private final ResourceRepository resourceRepository;
	private final FileStorageService fileStorageService;
	private final NotificationService notificationService;

	public IncidentServiceImpl(
			IncidentRepository incidentRepository,
			UserRepository userRepository,
			ResourceRepository resourceRepository,
			FileStorageService fileStorageService,
			NotificationService notificationService) {
		this.incidentRepository = incidentRepository;
		this.userRepository = userRepository;
		this.resourceRepository = resourceRepository;
		this.fileStorageService = fileStorageService;
		this.notificationService = notificationService;
	}

	@Override
	public IncidentResponseDto createIncident(String title, String description, String resourceId, MultipartFile file,
			String authenticatedEmail) {
		User currentUser = requireCurrentUser(authenticatedEmail);
		requireUserRole(currentUser);

		// Check required fields: title, description, and resource.
		if (isBlank(title) || isBlank(description) || isBlank(resourceId)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "title, description, and resourceId are required");
		}

		// Check resourceId is valid (resource must exist in database).
		resourceRepository.findById(resourceId.trim())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid resourceId"));

		Incident incident = new Incident();
		incident.setTitle(title.trim());
		incident.setDescription(description.trim());
		incident.setResourceId(resourceId.trim());
		incident.setUserId(currentUser.getId());
		incident.setStatus(IncidentStatus.PENDING);
		incident.setTechnicianRemarks("");
		incident.setAssignmentStatus(IncidentAssignmentStatus.UNASSIGNED);
		incident.setCreatedAt(Instant.now());

		if (file != null && !file.isEmpty()) {
			validateAttachment(file);
			incident.setAttachmentPath(fileStorageService.storeFile(file, "incidents"));
		}

		Incident savedIncident = incidentRepository.save(incident);
		// Create student-facing confirmation notification for inbox.
		notifyIncidentSubmitted(currentUser.getEmail(), savedIncident.getTitle());
		// Notify admins about new ticket; technicians are notified only when specifically assigned.
		notifyAdminsOnIncidentCreated(savedIncident, currentUser);
		return toIncidentData(savedIncident, false, true, false);
	}

	private void notifyIncidentSubmitted(String studentEmail, String incidentTitle) {
		if (isBlank(studentEmail)) {
			return;
		}
		String shortTitle = incidentTitle == null ? "" : incidentTitle.trim();
		if (shortTitle.length() > 120) {
			shortTitle = shortTitle.substring(0, 117) + "...";
		}
		String message = shortTitle.isEmpty()
				? "Your incident was submitted successfully."
				: "Incident submitted successfully: \"" + shortTitle + "\".";
		try {
			notificationService.createForUser(new CreateNotificationRequest(
					message,
					studentEmail.trim(),
					NotificationType.TICKET));
		} catch (Exception ex) {
			log.warn("Could not create submission notification for incident: {}", ex.getMessage());
		}
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
	public IncidentResponseDto updateMyPendingIncident(String incidentId, IncidentStudentUpdateRequest request,
			String authenticatedEmail) {
		User currentUser = requireCurrentUser(authenticatedEmail);
		requireUserRole(currentUser);

		Incident incident = incidentRepository.findById(incidentId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Incident not found"));

		// Student can edit only their own incident.
		if (!currentUser.getId().equals(incident.getUserId())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update your own incidents");
		}
		// Student can edit only when status is Pending.
		if (incident.getStatus() != IncidentStatus.PENDING) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only pending incidents can be updated");
		}

		// Check required fields for update.
		if (isBlank(request.getTitle()) || isBlank(request.getDescription()) || isBlank(request.getResourceId())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "title, description, and resourceId are required");
		}

		String resourceId = request.getResourceId().trim();
		// Check resource id exists.
		resourceRepository.findById(resourceId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid resourceId"));

		incident.setTitle(request.getTitle().trim());
		incident.setDescription(request.getDescription().trim());
		incident.setResourceId(resourceId);

		Incident updated = incidentRepository.save(incident);
		return toIncidentData(updated, false, true, false);
	}

	@Override
	public void deleteMyPendingIncident(String incidentId, String authenticatedEmail) {
		User currentUser = requireCurrentUser(authenticatedEmail);
		requireUserRole(currentUser);

		Incident incident = incidentRepository.findById(incidentId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Incident not found"));

		// Student can delete only their own incident.
		if (!currentUser.getId().equals(incident.getUserId())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own incidents");
		}
		// Student can delete only Pending incidents.
		if (incident.getStatus() != IncidentStatus.PENDING) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only pending incidents can be deleted");
		}

		incidentRepository.delete(incident);
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

		Incident incident = incidentRepository.findById(incidentId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Incident not found"));
		String previousAssignee = incident.getAssignedTo();
		// Resolved tickets are locked for assignment changes.
		if (request.getAssignedTo() != null && incident.getStatus() == IncidentStatus.RESOLVED) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Resolved incidents are locked and cannot be assigned or reassigned.");
		}

		if (currentUser.getRole() == Role.ADMIN) {
			if (request.getAssignedTo() != null) {
				// Check selected assignee is a valid technician.
				applyAssignedTechnician(incident, request.getAssignedTo(), currentUser.getId());
			}
		} else if (currentUser.getRole() == Role.TECHNICIAN) {
			// Technician cannot edit another technician's assigned ticket.
			if (!isBlank(incident.getAssignedTo()) && !currentUser.getId().equals(incident.getAssignedTo())) {
				throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This incident is assigned to another technician");
			}
			IncidentAssignmentStatus effectiveStatus = effectiveAssignmentStatus(incident);
			if (request.getStatus() != null) {
				// Technician must accept ticket before changing status.
				if (!isBlank(incident.getAssignedTo())
						&& effectiveStatus == IncidentAssignmentStatus.ASSIGNED) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Accept the assignment before updating status");
				}
				incident.setStatus(parseStatus(request.getStatus()));
			}
			if (request.getTechnicianRemarks() != null) {
				// Technician must accept ticket before adding remarks.
				if (!isBlank(incident.getAssignedTo())
						&& effectiveStatus == IncidentAssignmentStatus.ASSIGNED) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Accept the assignment before adding remarks");
				}
				incident.setTechnicianRemarks(request.getTechnicianRemarks().trim());
			}
			if (request.getAssignedTo() != null) {
				applyAssignedTechnician(incident, request.getAssignedTo(), currentUser.getId());
			}
		} else {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
		}

		Incident saved = incidentRepository.save(incident);
		if (currentUser.getRole() == Role.ADMIN
				&& !isBlank(saved.getAssignedTo())
				&& !safeText(saved.getAssignedTo()).equals(safeText(previousAssignee))) {
			notifyTechnicianAssigned(saved);
		}
		// If technician updates ticket, notify student and admin.
		if (currentUser.getRole() == Role.TECHNICIAN) {
			notifyOnTechnicianProgress(saved, currentUser);
		}
		return toIncidentData(saved, true, true, true);
	}

	@Override
	public IncidentResponseDto acceptAssignedIncident(String incidentId, String authenticatedEmail) {
		User currentUser = requireCurrentUser(authenticatedEmail);
		requireTechnicianRole(currentUser);

		Incident incident = incidentRepository.findById(incidentId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Incident not found"));
		// Ticket must be assigned to this technician.
		if (isBlank(incident.getAssignedTo()) || !currentUser.getId().equals(incident.getAssignedTo())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This incident is not assigned to you");
		}
		// Only Assigned tickets can be accepted.
		if (effectiveAssignmentStatus(incident) != IncidentAssignmentStatus.ASSIGNED) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Incident assignment is not pending acceptance");
		}

		incident.setAssignmentStatus(IncidentAssignmentStatus.ACCEPTED);
		// Work officially starts when the technician accepts — move ticket out of Pending.
		incident.setStatus(IncidentStatus.IN_PROGRESS);
		Incident saved = incidentRepository.save(incident);
		notifyAssignmentDecision(saved, currentUser, true);
		return toIncidentData(saved, true, true, true);
	}

	@Override
	public IncidentResponseDto declineAssignedIncident(String incidentId, String authenticatedEmail) {
		User currentUser = requireCurrentUser(authenticatedEmail);
		requireTechnicianRole(currentUser);

		Incident incident = incidentRepository.findById(incidentId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Incident not found"));
		// Ticket must be assigned to this technician.
		if (isBlank(incident.getAssignedTo()) || !currentUser.getId().equals(incident.getAssignedTo())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This incident is not assigned to you");
		}
		// Only Assigned tickets can be declined.
		if (effectiveAssignmentStatus(incident) != IncidentAssignmentStatus.ASSIGNED) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Incident assignment is not pending acceptance");
		}

		incident.setAssignmentStatus(IncidentAssignmentStatus.DECLINED);
		incident.setAssignedTo(null);
		Incident saved = incidentRepository.save(incident);
		notifyAssignmentDecision(saved, currentUser, false);
		return toIncidentData(saved, true, true, true);
	}

	private void applyAssignedTechnician(Incident incident, String assignedToRaw, String assignedByUserId) {
		String assignedTo = assignedToRaw.trim();
		if (assignedTo.isEmpty()) {
			incident.setAssignedTo(null);
			incident.setAssignedBy(null);
			incident.setAssignmentStatus(IncidentAssignmentStatus.UNASSIGNED);
			return;
		}
		User assignee = userRepository.findById(assignedTo)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid assignedTo user id"));
		// Incidents can be assigned only to Technician role.
		if (assignee.getRole() != Role.TECHNICIAN) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Incidents can only be assigned to technicians");
		}
		// Prevent multiple active assignments for the same technician.
		// A technician is considered busy while they have any non-resolved assigned incident.
		if (incidentRepository.existsByAssignedToAndStatusNotAndIdNot(assignedTo, IncidentStatus.RESOLVED, incident.getId())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Selected technician already has an active task. Please choose an available technician.");
		}
		incident.setAssignedTo(assignedTo);
		incident.setAssignedBy(assignedByUserId);
		incident.setAssignmentStatus(IncidentAssignmentStatus.ASSIGNED);
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

	private void requireTechnicianRole(User user) {
		if (user.getRole() != Role.TECHNICIAN) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only technicians can perform this action");
		}
	}

	private IncidentStatus parseStatus(String raw) {
		try {
			return IncidentStatus.fromValue(raw);
		} catch (Exception ex) {
			// Reject invalid status values from frontend.
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Invalid status. Allowed values: Pending, In Progress, Resolved");
		}
	}

	private void validateAttachment(MultipartFile file) {
		String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
		// Allow only image/PDF file types.
		boolean allowed = contentType.equals("application/pdf")
				|| contentType.equals("image/jpeg")
				|| contentType.equals("image/png")
				|| contentType.equals("image/webp")
				|| contentType.equals("image/gif");
		if (!allowed) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only image and PDF files are allowed");
		}
	}

	private void notifyAdminsOnIncidentCreated(Incident incident, User reporter) {
		String title = safeText(incident.getTitle());
		String reporterName = safeText(reporter.getFullName()).isEmpty() ? reporter.getEmail() : reporter.getFullName();
		String message = title.isEmpty()
				? "New incident ticket was submitted by " + reporterName + "."
				: "New incident ticket submitted by " + reporterName + ": \"" + title + "\".";

		// Send this notification to all admins.
		for (User admin : userRepository.findByRole(Role.ADMIN)) {
			if (isBlank(admin.getEmail())) {
				continue;
			}
			try {
				notificationService.createForUser(new CreateNotificationRequest(
						message,
						admin.getEmail().trim(),
						NotificationType.TICKET));
			} catch (Exception ex) {
				log.warn("Could not notify admin {} for incident creation: {}", admin.getId(), ex.getMessage());
			}
		}

	}

	private void notifyOnTechnicianProgress(Incident incident, User technician) {
		String technicianName = safeText(technician.getFullName()).isEmpty() ? technician.getEmail() : technician.getFullName();
		String title = safeText(incident.getTitle());
		String status = incident.getStatus() == null ? "updated" : incident.getStatus().getValue();
		String message = title.isEmpty()
				? technicianName + " updated your incident ticket to " + status + "."
				: technicianName + " updated incident \"" + title + "\" to " + status + ".";

		// Student gets progress updates for their own ticket.
		notifyIncidentRelatedUser(incident.getUserId(), message);
		// Admin who assigned/owns workflow visibility also gets progress updates.
		notifyIncidentRelatedUser(incident.getAssignedBy(), message);
	}

	private IncidentResponseDto toIncidentData(Incident incident, boolean includeUser, boolean includeResource,
			boolean includeAssignedTo) {
		IncidentAssignmentStatus effectiveAssignmentStatus = effectiveAssignmentStatus(incident);

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
				effectiveAssignmentStatus.getValue(),
				incident.getAttachmentPath(),
				incident.getTechnicianRemarks(),
				incident.getCreatedAt(),
				resourceData,
				userData,
				assignedToData);
	}

	private IncidentAssignmentStatus effectiveAssignmentStatus(Incident incident) {
		IncidentAssignmentStatus current = incident.getAssignmentStatus();
		if (current == null || (!isBlank(incident.getAssignedTo()) && current == IncidentAssignmentStatus.UNASSIGNED)) {
			return isBlank(incident.getAssignedTo())
					? IncidentAssignmentStatus.UNASSIGNED
					: IncidentAssignmentStatus.ASSIGNED;
		}
		return current;
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

	private String safeText(String value) {
		return value == null ? "" : value.trim();
	}

	private void notifyTechnicianAssigned(Incident incident) {
		if (isBlank(incident.getAssignedTo())) {
			return;
		}
		User technician = userRepository.findById(incident.getAssignedTo()).orElse(null);
		if (technician == null || isBlank(technician.getEmail())) {
			return;
		}
		String title = safeText(incident.getTitle());
		String message = title.isEmpty()
				? "A new incident ticket has been assigned to you."
				: "A new incident has been assigned to you: \"" + title + "\".";
		try {
			notificationService.createForUser(new CreateNotificationRequest(
					message,
					technician.getEmail().trim(),
					NotificationType.TICKET));
		} catch (Exception ex) {
			log.warn("Could not notify assigned technician: {}", ex.getMessage());
		}
	}

	private void notifyAssignmentDecision(Incident incident, User technician, boolean accepted) {
		String technicianName = safeText(technician.getFullName()).isEmpty() ? technician.getEmail() : technician.getFullName();
		String title = safeText(incident.getTitle());
		String action = accepted ? "accepted" : "declined";
		String message = title.isEmpty()
				? technicianName + " has " + action + " the assigned incident."
				: technicianName + " has " + action + " the incident: \"" + title + "\".";

		// Student should only be notified when technician accepts.
		if (accepted) {
			notifyIncidentRelatedUser(incident.getUserId(), message);
		}
		// Admin gets both accepted and declined updates.
		notifyIncidentRelatedUser(incident.getAssignedBy(), message);
	}

	private void notifyIncidentRelatedUser(String userId, String message) {
		if (isBlank(userId) || isBlank(message)) {
			return;
		}
		User target = userRepository.findById(userId).orElse(null);
		if (target == null || isBlank(target.getEmail())) {
			return;
		}
		try {
			notificationService.createForUser(new CreateNotificationRequest(
					message,
					target.getEmail().trim(),
					NotificationType.TICKET));
		} catch (Exception ex) {
			log.warn("Could not notify user {}: {}", userId, ex.getMessage());
		}
	}
}
