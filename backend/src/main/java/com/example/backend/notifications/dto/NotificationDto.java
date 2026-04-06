package com.example.backend.notifications.dto;

import java.time.Instant;

import com.example.backend.notifications.NotificationType;

public record NotificationDto(
		String id,
		String message,
		NotificationType type,
		Instant createdAt,
		Instant readAt) {
}

