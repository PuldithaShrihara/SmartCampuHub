package com.example.backend.notifications;

import java.time.Instant;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.notifications.dto.CreateNotificationRequest;
import com.example.backend.notifications.dto.NotificationDto;
import com.example.backend.notifications.dto.UnreadCountDto;

import org.springframework.http.HttpStatus;

@Service
public class NotificationService {

	private final NotificationRepository notificationRepository;

	public NotificationService(NotificationRepository notificationRepository) {
		this.notificationRepository = notificationRepository;
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

	public NotificationDto createForUser(CreateNotificationRequest request) {
		Notification n = new Notification();
		n.setMessage(request.message());
		n.setType(request.type());
		n.setUserEmail(request.userEmail().trim().toLowerCase());
		n.setCreatedAt(Instant.now());
		n.setReadAt(null);
		return toDto(notificationRepository.save(n));
	}
}

