package com.example.backend.booking.dto;

import jakarta.validation.constraints.NotBlank;

public record BookingStatusUpdateRequest(
	@NotBlank String status,
	String rejectionReason
) {
}
