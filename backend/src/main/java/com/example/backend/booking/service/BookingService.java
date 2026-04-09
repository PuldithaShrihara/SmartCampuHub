package com.example.backend.booking.service;

import com.example.backend.booking.dto.BookingRequest;
import com.example.backend.booking.dto.BookingResponse;

public interface BookingService {

    BookingResponse createBooking(BookingRequest request, String userEmail);

}
