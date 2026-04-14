package com.example.backend.booking.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.backend.booking.entity.Booking;

import java.util.List;
import com.example.backend.booking.entity.BookingStatus;

public interface BookingRepository extends MongoRepository<Booking, String> {
    long countByStatus(BookingStatus status);
    List<Booking> findTop5ByStatusOrderByCreatedAtDesc(BookingStatus status);
}
