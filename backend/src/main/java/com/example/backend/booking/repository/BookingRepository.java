package com.example.backend.booking.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.backend.booking.entity.Booking;

public interface BookingRepository extends MongoRepository<Booking, String> {
}
