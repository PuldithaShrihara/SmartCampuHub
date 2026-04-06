package com.example.backend.notifications.dto;

import com.example.backend.notifications.NotificationType;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateNotificationRequest(
		@NotBlank String message,
		@Email @NotBlank String userEmail,
		@NotNull NotificationType type) {
}

