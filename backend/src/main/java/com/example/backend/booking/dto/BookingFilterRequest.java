package com.example.backend.booking.dto;

import java.time.LocalDate;

import com.example.backend.booking.entity.BookingStatus;

public record BookingFilterRequest(
	LocalDate bookingDate,
	String resourceId,
	String userId,
	BookingStatus status
) {
}
