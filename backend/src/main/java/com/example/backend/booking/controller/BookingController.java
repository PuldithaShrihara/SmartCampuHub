package com.example.backend.booking.controller;

import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.booking.dto.BookingRequest;
import com.example.backend.booking.dto.BookingResponse;
import com.example.backend.booking.dto.QrLookupResponse;
import com.example.backend.booking.dto.BookingStatusUpdateRequest;
import com.example.backend.booking.entity.BookingStatus;
import com.example.backend.common.response.ApiResponse;
import com.example.backend.booking.service.BookingService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(@Valid @RequestBody BookingRequest request) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext()
                .getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            return ResponseEntity.status(401).build();
        }
        String email = auth.getPrincipal().toString();
        return ResponseEntity.ok(bookingService.createBooking(request, email));
    }

    @GetMapping("/my")
    public ResponseEntity<List<BookingResponse>> getMyBookings() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext()
                .getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            return ResponseEntity.status(401).build();
        }
        String email = auth.getPrincipal().toString();
        return ResponseEntity.ok(bookingService.getUserBookings(email));
    }

    @GetMapping("/all")
    public ResponseEntity<List<BookingResponse>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @GetMapping("/qr/{token}")
    public ResponseEntity<ApiResponse<BookingResponse>> getBookingByQrToken(@PathVariable("token") String token) {
        QrLookupResponse lookup = bookingService.getBookingByQrToken(token);
        String message = lookup.alreadyScanned() ? "QR already scanned" : "QR verified successfully";
        return ResponseEntity.ok(new ApiResponse<>(true, message, lookup.booking()));
    }

    @PutMapping("/{bookingId}/status")
    public ResponseEntity<ApiResponse<BookingResponse>> updateBookingStatus(
            @PathVariable String bookingId,
            @Valid @RequestBody BookingStatusUpdateRequest request) {
        String rawStatus = request.status() == null ? "" : request.status().trim();
        if (rawStatus.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Status is required", null));
        }

        BookingStatus status;
        try {
            status = BookingStatus.valueOf(rawStatus.toUpperCase());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false,
                            "Invalid status. Allowed values: PENDING, APPROVED, REJECTED, CANCELLED",
                            null));
        }

        BookingResponse updated = bookingService.updateBookingStatus(bookingId, status, request.rejectionReason());
        String message;
        if (status == BookingStatus.APPROVED) {
            message = "Booking approved successfully";
        } else if (status == BookingStatus.REJECTED) {
            message = "Booking rejected successfully";
        } else {
            message = "Booking status updated successfully";
        }
        return ResponseEntity.ok(new ApiResponse<>(true, message, updated));
    }

    @DeleteMapping("/{bookingId}")
    public ResponseEntity<Void> deleteBooking(@PathVariable String bookingId) {
        bookingService.deleteBooking(bookingId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/malformed")
    public ResponseEntity<List<String>> listMalformedBookings() {
        return ResponseEntity.ok(bookingService.findMalformedBookingIds());
    }

    @DeleteMapping("/malformed")
    public ResponseEntity<Map<String, Object>> deleteMalformedBookings() {
        int deleted = bookingService.deleteMalformedBookings();
        return ResponseEntity.ok(Map.of(
                "deletedCount", deleted,
                "message", "Malformed bookings cleanup completed"));
    }
}
