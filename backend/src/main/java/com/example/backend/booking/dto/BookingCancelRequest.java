package com.example.backend.booking.dto;

import jakarta.validation.constraints.NotBlank;

public record BookingCancelRequest(
	@NotBlank String cancelReason
) {
}
