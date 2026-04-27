package com.example.backend.incident.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.common.service.FileStorageService;
import com.example.backend.incident.dto.IncidentCommentRequest;
import com.example.backend.incident.dto.IncidentCommentResponseDto;
import com.example.backend.incident.dto.IncidentResourceSummaryDto;
import com.example.backend.incident.dto.IncidentResponseDto;
import com.example.backend.incident.dto.IncidentStudentUpdateRequest;
import com.example.backend.incident.dto.IncidentUpdateRequest;
import com.example.backend.incident.dto.IncidentUserSummaryDto;
import com.example.backend.incident.entity.IncidentComment;
import com.example.backend.incident.entity.IncidentAssignmentStatus;
import com.example.backend.incident.entity.Incident;
import com.example.backend.incident.entity.IncidentStatus;
import com.example.backend.incident.repository.IncidentCommentRepository;
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
	private static final List<IncidentStatus> ACTIVE_TASK_STATUSES = List.of(
			IncidentStatus.PENDING,
			IncidentStatus.OPEN,
			IncidentStatus.IN_PROGRESS);

	private final IncidentRepository incidentRepository;
	private final IncidentCommentRepository incidentCommentRepository;
	private final UserRepository userRepository;
	private final ResourceRepository resourceRepository;
	private final FileStorageService fileStorageService;
	private final NotificationService notificationService;

	public IncidentServiceImpl(
			IncidentRepository incidentRepository,
			IncidentCommentRepository incidentCommentRepository,
			UserRepository userRepository,
			ResourceRepository resourceRepository,
			FileStorageService fileStorageService,
			NotificationService notificationService) {
		this.incidentRepository = incidentRepository;
		this.incidentCommentRepository = incidentCommentRepository;
		this.userRepository = userRepository;
		this.resourceRepository = resourceRepository;
		this.fileStorageService = fileStorageService;
		this.notificationService = notificationService;
	}

	@Override
	public IncidentResponseDto createIncident(
			String title,
			String description,
			String category,
			String priority,
			String resourceId,
			String preferredContactName,
			String preferredContactEmail,
			List<MultipartFile> attachments,
			String authenticatedEmail) {
		User currentUser = requireCurrentUser(authenticatedEmail);
		requireUserRole(currentUser);

		// Check required fields.
		if (isBlank(title) || isBlank(description) || isBlank(category) || isBlank(priority)
				|| isBlank(resourceId) || isBlank(preferredContactName) || isBlank(preferredContactEmail)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"title, description, category, priority, resourceId, preferredContactName, and preferredContactEmail are required");
		}
		if (!isValidEmailFormat(preferredContactEmail)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "preferredContactEmail is invalid");
		}

		// Check resourceId is valid (resource must exist in database).
		resourceRepository.findById(resourceId.trim())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid resourceId"));

		Incident incident = new Incident();
		incident.setTitle(title.trim());
		incident.setDescription(description.trim());
		incident.setCategory(category.trim());
		incident.setPriority(priority.trim());
		incident.setResourceId(resourceId.trim());
		incident.setUserId(currentUser.getId());
		incident.setPreferredContactName(preferredContactName.trim());
		incident.setPreferredContactEmail(preferredContactEmail.trim().toLowerCase());
		incident.setStatus(IncidentStatus.OPEN);
		incident.setTechnicianRemarks("");
		incident.setRejectionReason("");
		incident.setAssignmentStatus(IncidentAssignmentStatus.UNASSIGNED);
		incident.setCreatedAt(Instant.now());

		List<String> savedAttachments = storeAttachments(attachments);
		if (!savedAttachments.isEmpty()) {
			incident.setAttachmentPaths(savedAttachments);
			incident.setAttachmentPath(savedAttachments.get(0));
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
		// Student can edit only when status is Open (or legacy Pending).
		if (!IncidentStatus.isOpenLike(incident.getStatus())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only open incidents can be updated");
		}

		// Check required fields for update.
		if (isBlank(request.getTitle()) || isBlank(request.getDescription()) || isBlank(request.getCategory())
				|| isBlank(request.getPriority()) || isBlank(request.getResourceId())
				|| isBlank(request.getPreferredContactName()) || isBlank(request.getPreferredContactEmail())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"title, description, category, priority, resourceId, preferredContactName, and preferredContactEmail are required");
		}
		if (!isValidEmailFormat(request.getPreferredContactEmail())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "preferredContactEmail is invalid");
		}

		String resourceId = request.getResourceId().trim();
		// Check resource id exists.
		resourceRepository.findById(resourceId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid resourceId"));

		incident.setTitle(request.getTitle().trim());
		incident.setDescription(request.getDescription().trim());
		incident.setCategory(request.getCategory().trim());
		incident.setPriority(request.getPriority().trim());
		incident.setResourceId(resourceId);
		incident.setPreferredContactName(request.getPreferredContactName().trim());
		incident.setPreferredContactEmail(request.getPreferredContactEmail().trim().toLowerCase());

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
		// Student can delete only Open incidents (or legacy Pending).
		if (!IncidentStatus.isOpenLike(incident.getStatus())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only open incidents can be deleted");
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
		IncidentAssignmentStatus effectiveAssignmentStatus = effectiveAssignmentStatus(incident);
		// Resolved/Closed/Rejected tickets are locked for assignment changes.
		if (request.getAssignedTo() != null
				&& (incident.getStatus() == IncidentStatus.RESOLVED
						|| incident.getStatus() == IncidentStatus.CLOSED
						|| incident.getStatus() == IncidentStatus.REJECTED)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Resolved/Closed/Rejected incidents are locked and cannot be assigned or reassigned.");
		}
		// Once a technician accepts the assignment, admin cannot reassign.
		if (request.getAssignedTo() != null
				&& !safeText(request.getAssignedTo()).equals(safeText(previousAssignee))
				&& effectiveAssignmentStatus == IncidentAssignmentStatus.ACCEPTED) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Technician already accepted this incident. Reassignment is locked.");
		}

		if (currentUser.getRole() == Role.ADMIN) {
			if (request.getStatus() != null) {
				IncidentStatus next = parseStatus(request.getStatus());
				incident.setStatus(next);
				if (next == IncidentStatus.REJECTED) {
					if (isBlank(request.getRejectionReason())) {
						throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
								"rejectionReason is required when status is Rejected");
					}
					incident.setRejectionReason(request.getRejectionReason().trim());
				} else {
					incident.setRejectionReason("");
				}
			}
			if (request.getAssignedTo() != null) {
				// Check selected assignee is a valid technician.
				applyAssignedTechnician(incident, request.getAssignedTo(), currentUser.getId());
			}
			if (request.getTechnicianRemarks() != null) {
				incident.setTechnicianRemarks(request.getTechnicianRemarks().trim());
			}
		} else if (currentUser.getRole() == Role.TECHNICIAN) {
			// Technician cannot edit another technician's assigned ticket.
			if (!isBlank(incident.getAssignedTo()) && !currentUser.getId().equals(incident.getAssignedTo())) {
				throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This incident is assigned to another technician");
			}
			IncidentAssignmentStatus effectiveStatus = effectiveAssignmentStatus;
			if (request.getStatus() != null) {
				// Technician must accept ticket before changing status.
				if (!isBlank(incident.getAssignedTo())
						&& effectiveStatus == IncidentAssignmentStatus.ASSIGNED) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Accept the assignment before updating status");
				}
				IncidentStatus next = parseStatus(request.getStatus());
				if (next != IncidentStatus.IN_PROGRESS && next != IncidentStatus.RESOLVED) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
							"Technician can update status only to In Progress or Resolved");
				}
				incident.setStatus(next);
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
			if (request.getRejectionReason() != null) {
				throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admin can reject incidents");
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

	@Override
	public List<IncidentCommentResponseDto> listComments(String incidentId, String authenticatedEmail) {
		User currentUser = requireCurrentUser(authenticatedEmail);
		Incident incident = requireIncidentReadableByUser(incidentId, currentUser);
		return incidentCommentRepository.findByIncidentIdOrderByCreatedAtAsc(incident.getId())
				.stream()
				.map(comment -> toCommentData(comment, currentUser))
				.toList();
	}

	@Override
	public IncidentCommentResponseDto addComment(String incidentId, IncidentCommentRequest request, String authenticatedEmail) {
		User currentUser = requireCurrentUser(authenticatedEmail);
		Incident incident = requireIncidentReadableByUser(incidentId, currentUser);
		String message = normalizeCommentMessage(request == null ? null : request.getMessage());
		IncidentComment comment = new IncidentComment();
		comment.setIncidentId(incident.getId());
		comment.setAuthorUserId(currentUser.getId());
		comment.setMessage(message);
		comment.setCreatedAt(Instant.now());
		comment.setUpdatedAt(Instant.now());
		IncidentComment saved = incidentCommentRepository.save(comment);
		return toCommentData(saved, currentUser);
	}

	@Override
	public IncidentCommentResponseDto updateComment(String incidentId, String commentId, IncidentCommentRequest request,
			String authenticatedEmail) {
		User currentUser = requireCurrentUser(authenticatedEmail);
		requireIncidentReadableByUser(incidentId, currentUser);
		IncidentComment comment = incidentCommentRepository.findByIdAndIncidentId(commentId, incidentId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));
		requireCommentEditPermission(comment, currentUser);
		comment.setMessage(normalizeCommentMessage(request == null ? null : request.getMessage()));
		comment.setUpdatedAt(Instant.now());
		IncidentComment saved = incidentCommentRepository.save(comment);
		return toCommentData(saved, currentUser);
	}

	@Override
	public void deleteComment(String incidentId, String commentId, String authenticatedEmail) {
		User currentUser = requireCurrentUser(authenticatedEmail);
		requireIncidentReadableByUser(incidentId, currentUser);
		IncidentComment comment = incidentCommentRepository.findByIdAndIncidentId(commentId, incidentId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));
		requireCommentDeletePermission(comment, currentUser);
		incidentCommentRepository.delete(comment);
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
		// A technician is considered busy while they have an OPEN or IN_PROGRESS assigned incident.
		if (incidentRepository.existsByAssignedToAndStatusInAndIdNot(assignedTo, ACTIVE_TASK_STATUSES, incident.getId())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Selected technician already has an active task. Please choose an available technician.");
		}
		incident.setAssignedTo(assignedTo);
		incident.setAssignedBy(assignedByUserId);
		incident.setAssignmentStatus(IncidentAssignmentStatus.ASSIGNED);
		// Admin assignment starts work immediately in this workflow.
		incident.setStatus(IncidentStatus.IN_PROGRESS);
		incident.setRejectionReason("");
	}

	private Incident requireIncidentReadableByUser(String incidentId, User currentUser) {
		Incident incident = incidentRepository.findById(incidentId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Incident not found"));
		if (currentUser.getRole() == Role.STUDENT && !currentUser.getId().equals(incident.getUserId())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only access your own incidents");
		}
		if (currentUser.getRole() != Role.STUDENT
				&& currentUser.getRole() != Role.ADMIN
				&& currentUser.getRole() != Role.TECHNICIAN) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
		}
		return incident;
	}

	private String normalizeCommentMessage(String message) {
		String normalized = message == null ? "" : message.trim();
		if (normalized.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment message is required");
		}
		if (normalized.length() > 1000) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment must be at most 1000 characters");
		}
		return normalized;
	}

	private void requireCommentEditPermission(IncidentComment comment, User user) {
		if (user.getRole() == Role.ADMIN) return;
		if (user.getId().equals(comment.getAuthorUserId())) return;
		throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can edit only your own comments");
	}

	private void requireCommentDeletePermission(IncidentComment comment, User user) {
		if (user.getRole() == Role.ADMIN) return;
		if (user.getId().equals(comment.getAuthorUserId())) return;
		throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can delete only your own comments");
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
					"Invalid status. Allowed values: Open, In Progress, Resolved, Closed, Rejected");
		}
	}

	private void validateAttachment(MultipartFile file) {
		String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
		// Allow only image evidence attachments.
		boolean allowed = contentType.equals("image/jpeg")
				|| contentType.equals("image/png")
				|| contentType.equals("image/webp")
				|| contentType.equals("image/gif");
		if (!allowed) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only image attachments are allowed");
		}
	}

	private List<String> storeAttachments(List<MultipartFile> attachments) {
		List<MultipartFile> safe = attachments == null ? List.of() : attachments.stream()
				.filter(file -> file != null && !file.isEmpty())
				.toList();
		if (safe.size() > 3) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Maximum 3 image attachments are allowed");
		}
		List<String> saved = new ArrayList<>();
		for (MultipartFile file : safe) {
			validateAttachment(file);
			saved.add(fileStorageService.storeFile(file, "incidents"));
		}
		return saved;
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
				incident.getCategory(),
				incident.getPriority(),
				incident.getPreferredContactName(),
				incident.getPreferredContactEmail(),
				incident.getStatus() == null ? null : incident.getStatus().getValue(),
				effectiveAssignmentStatus.getValue(),
				incident.getAttachmentPath(),
				incident.getAttachmentPaths(),
				incident.getRejectionReason(),
				incident.getTechnicianRemarks(),
				incident.getCreatedAt(),
				resourceData,
				userData,
				assignedToData);
	}

	private IncidentCommentResponseDto toCommentData(IncidentComment comment, User currentUser) {
		User author = userRepository.findById(comment.getAuthorUserId()).orElse(null);
		String authorName = author == null
				? "Unknown user"
				: (isBlank(author.getFullName()) ? safeText(author.getEmail()) : safeText(author.getFullName()));
		String authorRole = author == null || author.getRole() == null ? "" : author.getRole().name();
		boolean owner = currentUser.getId().equals(comment.getAuthorUserId());
		boolean admin = currentUser.getRole() == Role.ADMIN;
		return new IncidentCommentResponseDto(
				comment.getId(),
				comment.getIncidentId(),
				comment.getAuthorUserId(),
				authorName,
				authorRole,
				comment.getMessage(),
				comment.getCreatedAt(),
				comment.getUpdatedAt(),
				admin || owner,
				admin || owner);
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

	private boolean isValidEmailFormat(String value) {
		if (isBlank(value)) return false;
		String trimmed = value.trim();
		int atIdx = trimmed.indexOf('@');
		int dotIdx = trimmed.lastIndexOf('.');
		return atIdx > 0 && dotIdx > atIdx + 1 && dotIdx < trimmed.length() - 1;
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
