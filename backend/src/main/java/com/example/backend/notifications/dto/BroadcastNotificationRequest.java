package com.example.backend.notifications.dto;

import com.example.backend.notifications.NotificationType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record BroadcastNotificationRequest(
		@NotBlank @Size(max = 1000) String message,
		@NotNull NotificationType type) {
}
