package com.example.backend.booking.dto;

import java.time.LocalTime;

public record AvailabilityResponse(
	boolean available,
	String message,
	String conflictingBookingId,
	LocalTime nextAvailableTime
) {
}
