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
	CANCELLED;

	/**
	 * Accepts legacy / user-facing status values and normalizes them to enum members.
	 */
	public static BookingStatus fromExternalValue(String value) {
		if (value == null || value.trim().isEmpty()) {
			throw new IllegalArgumentException("Status is blank");
		}
		String normalized = value.trim().toUpperCase().replace('-', '_').replace(' ', '_');
		// Legacy data may contain "CHECKED IN". This state semantically means approved booking
		// that has been scanned, so map it to APPROVED for compatibility.
		if ("CHECKED_IN".equals(normalized)) {
			return APPROVED;
		}
		return BookingStatus.valueOf(normalized);
	}
}
