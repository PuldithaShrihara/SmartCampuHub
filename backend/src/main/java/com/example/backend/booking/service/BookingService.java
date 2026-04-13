package com.example.backend.booking.service;

import java.util.List;
import com.example.backend.booking.dto.BookingRequest;
import com.example.backend.booking.dto.BookingResponse;

public interface BookingService {

    BookingResponse createBooking(BookingRequest request, String userEmail);

    List<BookingResponse> getUserBookings(String userEmail);

}
