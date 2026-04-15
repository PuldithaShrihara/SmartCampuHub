package com.example.backend.booking.repository;

import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.backend.booking.entity.Booking;
import com.example.backend.booking.entity.BookingStatus;

public interface BookingRepository extends MongoRepository<Booking, String> {
    List<Booking> findByUser_Id(String userId);
    long countByStatus(BookingStatus status);
    List<Booking> findTop5ByStatusOrderByCreatedAtDesc(BookingStatus status);
}
