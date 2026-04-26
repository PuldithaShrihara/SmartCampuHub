package com.example.backend.notifications;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.notifications.dto.CreateNotificationRequest;
import com.example.backend.notifications.dto.MarkAllReadResultDto;
import com.example.backend.notifications.dto.NotificationDto;
import com.example.backend.notifications.dto.UnreadCountDto;
import com.example.backend.user.entity.Role;
import com.example.backend.user.entity.User;
import com.example.backend.user.repository.UserRepository;

import org.springframework.http.HttpStatus;

@Service
public class NotificationService {

	private final NotificationRepository notificationRepository;
	private final UserRepository userRepository;

	public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
		this.notificationRepository = notificationRepository;
		this.userRepository = userRepository;
	}

	private String currentUserEmail() {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		if (auth == null || auth.getPrincipal() == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not signed in");
		}
		return auth.getPrincipal().toString();
	}

	private NotificationDto toDto(Notification n) {
		return new NotificationDto(
				n.getId(),
				n.getMessage(),
				n.getType(),
				n.getCreatedAt(),
				n.getReadAt());
	}

	public List<NotificationDto> listForCurrentUser() {
		String email = currentUserEmail();
		return notificationRepository.findByUserEmailOrderByCreatedAtDesc(email).stream().map(this::toDto)
				.toList();
	}

	public UnreadCountDto unreadCountForCurrentUser() {
		String email = currentUserEmail();
		long count = notificationRepository.countByUserEmailAndReadAtIsNull(email);
		return new UnreadCountDto(count);
	}

	public NotificationDto markReadForCurrentUser(String notificationId) {
		String email = currentUserEmail();
		Notification notification = notificationRepository.findByIdAndUserEmail(notificationId, email)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
		if (notification.getReadAt() == null) {
			notification.setReadAt(Instant.now());
			notificationRepository.save(notification);
		}
		return toDto(notification);
	}

	public MarkAllReadResultDto markAllReadForCurrentUser() {
		String email = currentUserEmail();
		List<Notification> unread = notificationRepository.findByUserEmailAndReadAtIsNullOrderByCreatedAtDesc(email);
		if (unread.isEmpty()) {
			return new MarkAllReadResultDto(0);
		}
		Instant now = Instant.now();
		for (Notification item : unread) {
			item.setReadAt(now);
		}
		notificationRepository.saveAll(unread);
		return new MarkAllReadResultDto(unread.size());
	}

	public NotificationDto createForUser(CreateNotificationRequest request) {
		String normalizedEmail = normalizeAndValidateTargetEmail(request.userEmail());
		String normalizedMessage = normalizeMessage(request.message());
		Notification n = new Notification();
		n.setMessage(normalizedMessage);
		n.setType(request.type());
		n.setUserEmail(normalizedEmail);
		n.setCreatedAt(Instant.now());
		n.setReadAt(null);
		return toDto(notificationRepository.save(n));
	}

	public List<NotificationDto> createForRole(Role role, String message, NotificationType type) {
		String normalizedMessage = normalizeMessage(message);
		List<NotificationDto> created = new ArrayList<>();
		for (User user : userRepository.findByRole(role)) {
			if (user.getEmail() == null || user.getEmail().isBlank()) {
				continue;
			}
			created.add(createForUser(new CreateNotificationRequest(
					normalizedMessage,
					user.getEmail(),
					type)));
		}
		return created;
	}

	public List<NotificationDto> createForAll(String message, NotificationType type) {
		String normalizedMessage = normalizeMessage(message);
		List<NotificationDto> created = new ArrayList<>();
		for (User user : userRepository.findAll()) {
			if (user.getEmail() == null || user.getEmail().isBlank()) {
				continue;
			}
			created.add(createForUser(new CreateNotificationRequest(
					normalizedMessage,
					user.getEmail(),
					type)));
		}
		return created;
	}

	private String normalizeAndValidateTargetEmail(String userEmail) {
		String normalized = userEmail == null ? "" : userEmail.trim().toLowerCase();
		if (normalized.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target email is required");
		}
		if (!userRepository.existsByEmailIgnoreCase(normalized)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Target user not found");
		}
		return normalized;
	}

	private String normalizeMessage(String message) {
		String normalized = message == null ? "" : message.trim();
		if (normalized.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message is required");
		}
		if (normalized.length() > 1000) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message must be at most 1000 characters");
		}
		return normalized;
	}
}

