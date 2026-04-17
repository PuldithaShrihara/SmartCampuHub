package com.example.backend.booking.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

import com.example.backend.booking.entity.BookingStatus;
import com.example.backend.booking.entity.BookingType;

public record BookingResponse(
	String id,
	String resourceId,
	String resourceName,
	String resourceType,
	String resourceCategory,
	String userId,
	String userName,
	BookingType bookingType,
	LocalDate bookingDate,
	LocalTime startTime,
	LocalTime endTime,
	String purpose,
	Integer expectedAttendees,
	Integer quantityRequested,
	String notes,
	BookingStatus status,
	String rejectionReason,
	String cancelReason,
	Instant createdAt,
	Instant updatedAt
) {
}
