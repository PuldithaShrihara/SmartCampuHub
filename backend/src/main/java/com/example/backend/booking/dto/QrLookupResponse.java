package com.example.backend.booking.dto;

public record QrLookupResponse(BookingResponse booking, boolean alreadyScanned) {
}
