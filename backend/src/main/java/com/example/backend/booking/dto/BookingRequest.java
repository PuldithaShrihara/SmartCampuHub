package com.example.backend.booking.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record BookingRequest(
	@NotBlank(message = "Resource is required") String resourceId,
	@NotNull(message = "Date is required") LocalDate bookingDate,
	@NotNull(message = "Start time is required") LocalTime startTime,
	@NotNull(message = "End time is required") LocalTime endTime,
	@NotBlank(message = "Purpose is required")
	@Size(min = 3, max = 150, message = "Purpose must be between 3 and 150 characters")
	@Pattern(
			regexp = "^[\\p{L}\\p{N}\\s.,!?()'\"&:/-]+$",
			message = "Purpose contains invalid characters")
	String purpose,
	@NotNull(message = "Expected attendees is required")
	@Min(value = 1, message = "Expected attendees must be greater than 0")
	Integer expectedAttendees
) {
}
