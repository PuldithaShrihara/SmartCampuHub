package com.example.backend.booking.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

import com.example.backend.booking.entity.BookingStatus;

public record BookingResponse(
	String id,
	String resourceId,
	String resourceName,
	String resourceType,
	String userId,
	String userName,
	LocalDate bookingDate,
	LocalTime startTime,
	LocalTime endTime,
	String purpose,
	Integer expectedAttendees,
	BookingStatus status,
	String rejectionReason,
	String cancelReason,
	Instant createdAt,
	Instant updatedAt
) {
}
