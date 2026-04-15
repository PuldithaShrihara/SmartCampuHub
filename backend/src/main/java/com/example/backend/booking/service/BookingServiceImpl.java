package com.example.backend.booking.service;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.example.backend.booking.dto.BookingRequest;
import com.example.backend.booking.dto.BookingResponse;
import com.example.backend.booking.entity.Booking;
import com.example.backend.booking.entity.BookingStatus;
import com.example.backend.booking.mapper.BookingMapper;
import com.example.backend.booking.repository.BookingRepository;
import com.example.backend.resource.entity.Resource;
import com.example.backend.resource.repository.ResourceRepository;
import com.example.backend.user.entity.User;
import com.example.backend.user.repository.UserRepository;

@Service
public class BookingServiceImpl implements BookingService {
    private static final Logger log = LoggerFactory.getLogger(BookingServiceImpl.class);

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final BookingMapper bookingMapper;

    public BookingServiceImpl(BookingRepository bookingRepository, UserRepository userRepository,
            ResourceRepository resourceRepository, BookingMapper bookingMapper) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.resourceRepository = resourceRepository;
        this.bookingMapper = bookingMapper;
    }

    @Override
    public BookingResponse createBooking(BookingRequest request, String userEmail) {
        log.info("createBooking request received: userEmail={}, resourceId={}, date={}, start={}, end={}",
                userEmail, request.resourceId(), request.bookingDate(), request.startTime(), request.endTime());

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

        Resource resource = resourceRepository.findById(request.resourceId())
                .orElseThrow(() -> new RuntimeException("Resource not found: " + request.resourceId()));

        Booking booking = bookingMapper.toEntity(request, user, resource);
        Booking savedBooking = bookingRepository.save(booking);
        log.info("createBooking persisted successfully: bookingId={}, status={}",
                savedBooking.getId(), savedBooking.getStatus());

        return bookingMapper.toResponse(savedBooking);
    }

    @Override
    public List<BookingResponse> getUserBookings(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

        return bookingRepository.findByUser_Id(user.getId())
                .stream()
                .map(bookingMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<BookingResponse> getAllBookings() {
        List<Booking> bookings = bookingRepository.findAll();
        List<String> malformedIds = bookings.stream()
                .filter(booking -> booking.getResource() == null)
                .map(Booking::getId)
                .filter(Objects::nonNull)
                .toList();
        if (!malformedIds.isEmpty()) {
            log.warn("Malformed bookings detected with null resource reference: {}", malformedIds);
        }

        List<BookingResponse> responses = bookings
                .stream()
                .map(bookingMapper::toResponse)
                .collect(Collectors.toList());
        log.info("getAllBookings returned {} records", responses.size());
        return responses;
    }

    @Override
    public BookingResponse updateBookingStatus(String bookingId, BookingStatus status, String rejectionReason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

        booking.setStatus(status);
        if (status == BookingStatus.REJECTED) {
            String reason = rejectionReason != null ? rejectionReason.trim() : "";
            booking.setRejectionReason(reason.isEmpty() ? "Rejected by admin" : reason);
        } else {
            booking.setRejectionReason(null);
        }

        Booking updatedBooking = bookingRepository.save(booking);
        return bookingMapper.toResponse(updatedBooking);
    }

    @Override
    public void deleteBooking(String bookingId) {
        if (!bookingRepository.existsById(bookingId)) {
            throw new RuntimeException("Booking not found: " + bookingId);
        }
        bookingRepository.deleteById(bookingId);
    }

    @Override
    public List<String> findMalformedBookingIds() {
        return bookingRepository.findAll().stream()
                .filter(booking -> booking.getResource() == null)
                .map(Booking::getId)
                .filter(Objects::nonNull)
                .toList();
    }

    @Override
    public int deleteMalformedBookings() {
        List<String> malformedIds = findMalformedBookingIds();
        if (!malformedIds.isEmpty()) {
            bookingRepository.deleteAllById(malformedIds);
            log.warn("Deleted malformed bookings with null resource reference: {}", malformedIds);
        }
        return malformedIds.size();
    }
}
