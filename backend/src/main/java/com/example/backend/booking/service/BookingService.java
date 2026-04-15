package com.example.backend.booking.service;

import java.util.List;
import com.example.backend.booking.dto.BookingRequest;
import com.example.backend.booking.dto.BookingResponse;
import com.example.backend.booking.entity.BookingStatus;

public interface BookingService {

    BookingResponse createBooking(BookingRequest request, String userEmail);

    List<BookingResponse> getUserBookings(String userEmail);

    List<BookingResponse> getAllBookings();

    BookingResponse updateBookingStatus(String bookingId, BookingStatus status, String rejectionReason);

    void deleteBooking(String bookingId);

    List<String> findMalformedBookingIds();

    int deleteMalformedBookings();

}
