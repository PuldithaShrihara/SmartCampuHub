package com.example.backend.notifications;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.notifications.dto.BroadcastNotificationRequest;
import com.example.backend.notifications.dto.CreateNotificationRequest;
import com.example.backend.notifications.dto.NotificationDto;
import com.example.backend.user.entity.Role;

import jakarta.validation.Valid;

@RestController
@Validated
@RequestMapping("/api/admin/notifications")
public class AdminNotificationController {

	private final NotificationService notificationService;

	public AdminNotificationController(NotificationService notificationService) {
		this.notificationService = notificationService;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public NotificationDto create(@Valid @RequestBody CreateNotificationRequest request) {
		return notificationService.createForUser(request);
	}

	@PostMapping("/broadcast")
	@ResponseStatus(HttpStatus.CREATED)
	public List<NotificationDto> broadcastAll(@Valid @RequestBody BroadcastNotificationRequest request) {
		return notificationService.createForAll(request.message(), request.type());
	}

	@PostMapping("/broadcast/role/{role}")
	@ResponseStatus(HttpStatus.CREATED)
	public List<NotificationDto> broadcastRole(
			@PathVariable("role") Role role,
			@Valid @RequestBody BroadcastNotificationRequest request) {
		return notificationService.createForRole(role, request.message(), request.type());
	}
}

