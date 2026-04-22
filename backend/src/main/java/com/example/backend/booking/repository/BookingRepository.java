package com.example.backend.booking.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.backend.booking.entity.Booking;
import com.example.backend.booking.entity.BookingStatus;

public interface BookingRepository extends MongoRepository<Booking, String> {
    List<Booking> findByUser_Id(String userId);
    List<Booking> findByResource_IdAndBookingDate(String resourceId, LocalDate bookingDate);
    List<Booking> findByResource_IdAndBookingDateAndStatusIn(String resourceId, LocalDate bookingDate, List<BookingStatus> statuses);
    long countByStatus(BookingStatus status);
    List<Booking> findTop5ByStatusOrderByCreatedAtDesc(BookingStatus status);
    List<Booking> findByResourceIsNull();
    Optional<Booking> findByQrToken(String qrToken);
    Optional<Booking> findByQrTokenIgnoreCase(String qrToken);
}
