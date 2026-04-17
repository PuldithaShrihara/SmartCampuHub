package com.example.backend.booking.service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
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
import com.example.backend.booking.entity.BookingType;
import com.example.backend.booking.mapper.BookingMapper;
import com.example.backend.booking.repository.BookingRepository;
import com.example.backend.resource.entity.ResourceCategory;
import com.example.backend.resource.entity.Resource;
import com.example.backend.resource.entity.ResourceStatus;
import com.example.backend.resource.repository.ResourceRepository;
import com.example.backend.user.entity.User;
import com.example.backend.user.repository.UserRepository;

@Service
public class BookingServiceImpl implements BookingService {
    private static final Logger log = LoggerFactory.getLogger(BookingServiceImpl.class);
    private static final LocalTime WORK_DAY_START = LocalTime.of(8, 0);
    private static final LocalTime WORK_DAY_END = LocalTime.of(18, 0);
    private static final long MIN_DURATION_MINUTES = 30;
    private static final long MAX_DURATION_MINUTES = 240;
    private static final List<BookingStatus> BLOCKING_STATUSES = List.of(BookingStatus.PENDING, BookingStatus.APPROVED);

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
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

        Resource resource = resourceRepository.findById(request.resourceId())
                .orElseThrow(() -> new RuntimeException("Resource not found: " + request.resourceId()));
        validateCreateBookingRequest(request, resource);

        Booking booking = bookingMapper.toEntity(request, user, resource);
        Booking savedBooking = bookingRepository.save(booking);
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

    private void validateCreateBookingRequest(BookingRequest request, Resource resource) {
        if (request.bookingType() == null) {
            throw new RuntimeException("Booking type is required");
        }
        if (resource.getStatus() != ResourceStatus.ACTIVE) {
            throw new RuntimeException("Selected resource is not available for booking");
        }

        ResourceCategory resourceCategory = resolveCategory(resource);
        if (request.bookingType() == BookingType.SPACE && resourceCategory != ResourceCategory.SPACE) {
            throw new RuntimeException("Selected resource is not a space resource");
        }
        if (request.bookingType() == BookingType.EQUIPMENT && resourceCategory != ResourceCategory.EQUIPMENT) {
            throw new RuntimeException("Selected resource is not an equipment resource");
        }

        LocalDate today = LocalDate.now();
        if (request.bookingDate().isBefore(today)) {
            throw new RuntimeException("Booking date cannot be in the past");
        }

        LocalTime startTime = request.startTime();
        LocalTime endTime = request.endTime();

        if (startTime.isBefore(WORK_DAY_START) || startTime.isAfter(WORK_DAY_END)) {
            throw new RuntimeException("Start time must be within working hours (08:00 - 18:00)");
        }
        if (endTime.isBefore(WORK_DAY_START) || endTime.isAfter(WORK_DAY_END)) {
            throw new RuntimeException("End time must be within working hours (08:00 - 18:00)");
        }
        if (!endTime.isAfter(startTime)) {
            throw new RuntimeException("End time must be later than start time");
        }
        if (!isHalfHourSlot(startTime) || !isHalfHourSlot(endTime)) {
            throw new RuntimeException("Start and end times must align to 30-minute slots");
        }
        if (!isWithinAvailabilityWindows(resource, startTime, endTime)) {
            throw new RuntimeException("Selected time range is outside resource availability window");
        }

        long durationMinutes = Duration.between(startTime, endTime).toMinutes();
        if (durationMinutes < MIN_DURATION_MINUTES || durationMinutes > MAX_DURATION_MINUTES) {
            throw new RuntimeException("Booking duration must be between 30 minutes and 4 hours");
        }

        if (request.bookingDate().isEqual(today) && !startTime.isAfter(LocalTime.now())) {
            throw new RuntimeException("Start time must be in the future for bookings made today");
        }

        if (request.bookingType() == BookingType.SPACE) {
            validateSpaceBookingRules(request, resource, startTime, endTime);
            return;
        }
        validateEquipmentBookingRules(request, resource, startTime, endTime);
    }

    private boolean isHalfHourSlot(LocalTime time) {
        int minute = time.getMinute();
        return minute == 0 || minute == 30;
    }

    private boolean timeRangesOverlap(LocalTime startA, LocalTime endA, LocalTime startB, LocalTime endB) {
        return startA.isBefore(endB) && endA.isAfter(startB);
    }

    private void validateSpaceBookingRules(BookingRequest request, Resource resource, LocalTime startTime, LocalTime endTime) {
        Integer attendees = request.expectedAttendees();
        if (attendees == null || attendees < 1) {
            throw new RuntimeException("Expected attendees must be greater than 0");
        }
        Integer capacity = resource.getCapacity();
        if (capacity != null && attendees > capacity) {
            throw new RuntimeException("Expected attendees exceed selected resource capacity");
        }
        List<Booking> existing = bookingRepository.findByResource_IdAndBookingDate(resource.getId(), request.bookingDate());
        boolean hasConflict = existing.stream()
                .filter(booking -> booking.getStatus() != BookingStatus.REJECTED && booking.getStatus() != BookingStatus.CANCELLED)
                .anyMatch(booking -> timeRangesOverlap(startTime, endTime, booking.getStartTime(), booking.getEndTime()));
        if (hasConflict) {
            throw new RuntimeException("Selected time slot is already booked for this resource");
        }
    }

    private void validateEquipmentBookingRules(BookingRequest request, Resource resource, LocalTime startTime, LocalTime endTime) {
        Integer quantityRequested = request.quantityRequested();
        if (quantityRequested == null || quantityRequested < 1) {
            throw new RuntimeException("Quantity requested must be greater than 0");
        }
        Integer totalQuantity = resource.getQuantity();
        if (totalQuantity == null || totalQuantity < 1) {
            throw new RuntimeException("Selected equipment does not have available stock configured");
        }
        if (quantityRequested > totalQuantity) {
            throw new RuntimeException("Quantity requested exceeds available equipment quantity");
        }

        List<Booking> overlappingBookings = bookingRepository.findByResource_IdAndBookingDateAndStatusIn(
                resource.getId(), request.bookingDate(), BLOCKING_STATUSES);
        int alreadyBookedQuantity = overlappingBookings.stream()
                .filter(booking -> booking.getBookingType() == BookingType.EQUIPMENT)
                .filter(booking -> timeRangesOverlap(startTime, endTime, booking.getStartTime(), booking.getEndTime()))
                .map(Booking::getQuantityRequested)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .sum();

        if (alreadyBookedQuantity + quantityRequested > totalQuantity) {
            throw new RuntimeException("Quantity requested exceeds currently available quantity for this time range");
        }
    }

    private ResourceCategory resolveCategory(Resource resource) {
        if (resource.getCategory() != null) return resource.getCategory();
        return resource.getType() == com.example.backend.resource.entity.ResourceType.EQUIPMENT
                ? ResourceCategory.EQUIPMENT
                : ResourceCategory.SPACE;
    }

    private boolean isWithinAvailabilityWindows(Resource resource, LocalTime startTime, LocalTime endTime) {
        List<String> windows = resource.getAvailabilityWindows();
        if (windows == null || windows.isEmpty()) return true;
        return windows.stream()
                .map(this::parseWindow)
                .filter(Objects::nonNull)
                .anyMatch(window -> !startTime.isBefore(window.start()) && !endTime.isAfter(window.end()));
    }

    private TimeWindow parseWindow(String rawWindow) {
        if (rawWindow == null || !rawWindow.contains("-")) return null;
        String[] parts = rawWindow.trim().split("-");
        if (parts.length != 2) return null;
        try {
            return new TimeWindow(LocalTime.parse(parts[0].trim()), LocalTime.parse(parts[1].trim()));
        } catch (Exception ex) {
            return null;
        }
    }

    private record TimeWindow(LocalTime start, LocalTime end) {
    }
}
