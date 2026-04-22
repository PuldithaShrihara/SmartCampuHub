package com.example.backend.booking.entity;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import com.fasterxml.jackson.annotation.JsonFormat;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import com.example.backend.resource.entity.Resource;
import com.example.backend.user.entity.User;

/**
 * Campus resource booking persisted in MongoDB.
 * <p>
 * This project uses Spring Data MongoDB ({@code @Document}, {@code @DBRef}),
 * not JPA.
 * Enum values are stored by name in BSON (same idea as JPA
 * {@code EnumType.STRING}).
 */
@Document(collection = "bookings")
public class Booking {

	@Id
	private String id;

	@DBRef
	private User user;

	@DBRef
	private Resource resource;

	private BookingType bookingType;

	private LocalDate bookingDate;

	@JsonFormat(pattern = "HH:mm")
	private LocalTime startTime;

	@JsonFormat(pattern = "HH:mm")
	private LocalTime endTime;

	private String purpose;

	private Integer expectedAttendees;

	private Integer quantityRequested;

	private String notes;

	private BookingStatus status;

	private String rejectionReason;

	private String cancelReason;

	@CreatedDate
	private Instant createdAt;

	@LastModifiedDate
	private Instant updatedAt;

	private String qrToken;

	private boolean qrGenerated;

	private Instant qrGeneratedAt;

	private Instant qrScannedAt;

	public Booking() {
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public User getUser() {
		return user;
	}

	public void setUser(User user) {
		this.user = user;
	}

	public Resource getResource() {
		return resource;
	}

	public void setResource(Resource resource) {
		this.resource = resource;
	}

	public LocalDate getBookingDate() {
		return bookingDate;
	}

	public void setBookingDate(LocalDate bookingDate) {
		this.bookingDate = bookingDate;
	}

	public BookingType getBookingType() {
		return bookingType;
	}

	public void setBookingType(BookingType bookingType) {
		this.bookingType = bookingType;
	}

	public LocalTime getStartTime() {
		return startTime;
	}

	public void setStartTime(LocalTime startTime) {
		this.startTime = startTime;
	}

	public LocalTime getEndTime() {
		return endTime;
	}

	public void setEndTime(LocalTime endTime) {
		this.endTime = endTime;
	}

	public String getPurpose() {
		return purpose;
	}

	public void setPurpose(String purpose) {
		this.purpose = purpose;
	}

	public Integer getExpectedAttendees() {
		return expectedAttendees;
	}

	public void setExpectedAttendees(Integer expectedAttendees) {
		this.expectedAttendees = expectedAttendees;
	}

	public Integer getQuantityRequested() {
		return quantityRequested;
	}

	public void setQuantityRequested(Integer quantityRequested) {
		this.quantityRequested = quantityRequested;
	}

	public String getNotes() {
		return notes;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

	public BookingStatus getStatus() {
		return status;
	}

	public void setStatus(BookingStatus status) {
		this.status = status;
	}

	public String getRejectionReason() {
		return rejectionReason;
	}

	public void setRejectionReason(String rejectionReason) {
		this.rejectionReason = rejectionReason;
	}

	public String getCancelReason() {
		return cancelReason;
	}

	public void setCancelReason(String cancelReason) {
		this.cancelReason = cancelReason;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(Instant updatedAt) {
		this.updatedAt = updatedAt;
	}

	public String getQrToken() {
		return qrToken;
	}

	public void setQrToken(String qrToken) {
		this.qrToken = qrToken;
	}

	public boolean isQrGenerated() {
		return qrGenerated;
	}

	public void setQrGenerated(boolean qrGenerated) {
		this.qrGenerated = qrGenerated;
	}

	public Instant getQrGeneratedAt() {
		return qrGeneratedAt;
	}

	public void setQrGeneratedAt(Instant qrGeneratedAt) {
		this.qrGeneratedAt = qrGeneratedAt;
	}

	public Instant getQrScannedAt() {
		return qrScannedAt;
	}

	public void setQrScannedAt(Instant qrScannedAt) {
		this.qrScannedAt = qrScannedAt;
	}
}
