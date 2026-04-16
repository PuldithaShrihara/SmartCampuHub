package com.example.backend.booking.repository;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.backend.booking.entity.Booking;
import com.example.backend.booking.entity.BookingStatus;

public interface BookingRepository extends MongoRepository<Booking, String> {
    List<Booking> findByUser_Id(String userId);
    List<Booking> findByResource_IdAndBookingDate(String resourceId, LocalDate bookingDate);
    long countByStatus(BookingStatus status);
    List<Booking> findTop5ByStatusOrderByCreatedAtDesc(BookingStatus status);
    List<Booking> findByResourceIsNull();
}
