package com.example.backend.booking.entity;

/**
 * Lifecycle state of a booking request.
 * <p>
 * Persisted as the enum name (string) in MongoDB.
 */
public enum BookingStatus {

	PENDING,
	APPROVED,
	CHECKED_IN,
	REJECTED,
	CANCELLED
}
