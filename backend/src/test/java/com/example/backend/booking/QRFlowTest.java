package com.example.backend.booking;

import com.example.backend.booking.entity.Booking;
import com.example.backend.booking.repository.BookingRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

@SpringBootTest
class QRFlowTest {

    @Autowired
    private BookingRepository bookingRepository;

    @Test
    void checkBookingQRData() {
        List<Booking> bookings = bookingRepository.findAll();
        System.out.println("DEBUG: Found " + bookings.size() + " bookings.");
        for (Booking b : bookings) {
            System.out.println("DEBUG: Booking ID: " + b.getId()
                    + " | Status: " + b.getStatus()
                    + " | QR Generated: " + b.isQrGenerated()
                    + " | Token: " + b.getQrToken());
        }
    }
}
