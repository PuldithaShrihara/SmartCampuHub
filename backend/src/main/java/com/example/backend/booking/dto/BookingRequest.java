package com.example.backend.booking.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record BookingRequest(
	@NotBlank String resourceId,
	@NotNull LocalDate bookingDate,
	@NotNull LocalTime startTime,
	@NotNull LocalTime endTime,
	@NotBlank String purpose,
	@NotNull @Positive Integer expectedAttendees
) {
}
