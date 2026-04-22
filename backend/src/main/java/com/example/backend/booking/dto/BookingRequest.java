package com.example.backend.booking.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import com.example.backend.booking.entity.BookingType;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record BookingRequest(
	@NotNull(message = "Booking type is required") BookingType bookingType,
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
	@Min(value = 1, message = "Expected attendees must be greater than 0") Integer expectedAttendees,
	@Min(value = 1, message = "Quantity requested must be greater than 0") Integer quantityRequested,
	@Size(max = 250, message = "Notes cannot exceed 250 characters") String notes
) {
}
