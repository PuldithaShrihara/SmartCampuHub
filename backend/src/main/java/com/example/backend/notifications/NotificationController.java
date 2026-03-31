package com.example.backend.notifications;

import java.util.List;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.notifications.dto.NotificationDto;
import com.example.backend.notifications.dto.UnreadCountDto;

@RestController
@Validated
@RequestMapping("/api/notifications")
public class NotificationController {

	private final NotificationService notificationService;

	public NotificationController(NotificationService notificationService) {
		this.notificationService = notificationService;
	}

	@GetMapping
	public List<NotificationDto> list() {
		return notificationService.listForCurrentUser();
	}

	@GetMapping("/unread-count")
	public UnreadCountDto unreadCount() {
		return notificationService.unreadCountForCurrentUser();
	}

	@PatchMapping("/{id}/read")
	public NotificationDto markRead(@PathVariable("id") String notificationId) {
		return notificationService.markReadForCurrentUser(notificationId);
	}
}

