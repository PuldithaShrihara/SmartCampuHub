package com.example.backend.booking.repository;

import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.backend.booking.entity.Booking;

public interface BookingRepository extends MongoRepository<Booking, String> {
    List<Booking> findByUser_Id(String userId);
}
