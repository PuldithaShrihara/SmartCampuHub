package com.example.backend.notifications;

import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.notifications.dto.CreateNotificationRequest;
import com.example.backend.notifications.dto.NotificationDto;

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
}

