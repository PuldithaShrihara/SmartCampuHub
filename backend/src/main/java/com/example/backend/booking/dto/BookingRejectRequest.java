package com.example.backend.booking.dto;

import jakarta.validation.constraints.NotBlank;

public record BookingRejectRequest(
	@NotBlank String rejectionReason
) {
}
