package com.example.backend.booking.service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.time.Instant;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.booking.dto.BookingRequest;
import com.example.backend.booking.dto.BookingResponse;
import com.example.backend.booking.dto.QrLookupResponse;
import com.example.backend.booking.entity.Booking;
import com.example.backend.booking.entity.BookingStatus;
import com.example.backend.booking.entity.BookingType;
import com.example.backend.booking.mapper.BookingMapper;
import com.example.backend.booking.repository.BookingRepository;
import com.example.backend.mail.EmailService;
import com.example.backend.notifications.NotificationService;
import com.example.backend.notifications.NotificationType;
import com.example.backend.notifications.dto.CreateNotificationRequest;
import com.example.backend.resource.entity.ResourceCategory;
import com.example.backend.resource.entity.Resource;
import com.example.backend.resource.entity.ResourceStatus;
import com.example.backend.resource.repository.ResourceRepository;
import com.example.backend.user.entity.Role;
import com.example.backend.user.entity.User;
import com.example.backend.user.repository.UserRepository;
import com.example.backend.util.QRCodeGenerator;

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
    private final EmailService emailService;
    private final NotificationService notificationService;

    public BookingServiceImpl(BookingRepository bookingRepository, UserRepository userRepository,
            ResourceRepository resourceRepository, BookingMapper bookingMapper, EmailService emailService,
            NotificationService notificationService) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.resourceRepository = resourceRepository;
        this.bookingMapper = bookingMapper;
        this.emailService = emailService;
        this.notificationService = notificationService;
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
        notifyBookingCreated(savedBooking);
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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

        booking.setStatus(status);

        if (status == BookingStatus.REJECTED) {
            String reason = rejectionReason != null ? rejectionReason.trim() : "";
            booking.setRejectionReason(reason.isEmpty() ? "Rejected by admin" : reason);
        } else {
            booking.setRejectionReason(null);
        }

        // Logic for QR code generation when approved.
        // We trigger if it's currently APPROVED and hasn't had a QR generated yet.
        if (status == BookingStatus.APPROVED && !booking.isQrGenerated()) {
            try {
                String token = UUID.randomUUID().toString();
                String verifyUrl = "http://localhost:3000/verify-booking/" + token;

                byte[] qrImage = QRCodeGenerator.generateQRCodeImage(verifyUrl, 250, 250);

                booking.setQrToken(token);
                booking.setQrGenerated(true);
                booking.setQrGeneratedAt(Instant.now());

                emailService.sendBookingApprovalEmail(booking, qrImage);
                log.info("Generated QR code and sent approval email for booking: {}", bookingId);
            } catch (Exception e) {
                log.error("Failed to generate QR or send approval email for booking: {}", bookingId, e);
            }
        }

        Booking updatedBooking = bookingRepository.save(booking);
        notifyBookingStatusUpdated(updatedBooking);
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
    public QrLookupResponse getBookingByQrToken(String qrToken) {
        String raw = qrToken == null ? "" : qrToken;
        String normalized = normalizeQrLookupValue(raw);
        if (normalized.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "QR token is required");
        }

        Set<String> candidates = extractLookupCandidates(normalized);
        log.info("QR verification lookup started. raw='{}', normalized='{}', candidates={}",
                safeForLog(raw), safeForLog(normalized), candidates);

        Booking booking = null;
        for (String candidate : candidates) {
            booking = bookingRepository.findByQrToken(candidate)
                    .or(() -> bookingRepository.findByQrTokenIgnoreCase(candidate))
                    .orElse(null);
            if (booking != null) {
                log.info("QR verification matched by qrToken. candidate='{}', bookingId='{}'",
                        safeForLog(candidate), booking.getId());
                break;
            }
        }

        // Backward compatibility: legacy payloads may carry booking id.
        if (booking == null) {
            for (String candidate : candidates) {
                booking = bookingRepository.findById(candidate).orElse(null);
                if (booking != null) {
                    log.info("QR verification matched by booking id fallback. candidate='{}', bookingId='{}'",
                            safeForLog(candidate), booking.getId());
                    break;
                }
            }
        }

        if (booking == null) {
            log.warn("QR verification failed. No booking found for raw='{}', normalized='{}'",
                    safeForLog(raw), safeForLog(normalized));
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found for QR token");
        }

        if (booking.getStatus() != BookingStatus.APPROVED) {
            log.warn("QR verification rejected. Booking is not approved. bookingId='{}', status='{}'",
                    booking.getId(), booking.getStatus());
            throw new ResponseStatusException(HttpStatus.GONE, "QR is no longer valid for this booking status");
        }

        if (booking.getQrToken() == null || booking.getQrToken().isBlank()) {
            log.warn("QR verification rejected. Booking has no stored QR token. bookingId='{}'", booking.getId());
            throw new ResponseStatusException(HttpStatus.GONE, "QR is not active for this booking");
        }

        if (booking.getQrScannedAt() != null) {
            log.info("QR verification already scanned. bookingId='{}', scannedAt='{}'",
                    booking.getId(), booking.getQrScannedAt());
            return new QrLookupResponse(bookingMapper.toResponse(booking), true);
        }

        booking.setQrScannedAt(Instant.now());
        Booking saved = bookingRepository.save(booking);
        log.info("QR verification success. Marked scanned. bookingId='{}', scannedAt='{}'",
                saved.getId(), saved.getQrScannedAt());
        return new QrLookupResponse(bookingMapper.toResponse(saved), false);
    }

    private String normalizeQrLookupValue(String raw) {
        String value = raw == null ? "" : raw.trim();
        if (value.isEmpty()) {
            return "";
        }
        try {
            value = URLDecoder.decode(value, StandardCharsets.UTF_8);
        } catch (Exception ignored) {
            // keep original if decode fails
        }
        value = value.replace("\"", "").replace("'", "").trim();
        if (value.endsWith("/")) {
            value = value.substring(0, value.length() - 1).trim();
        }
        return value;
    }

    private Set<String> extractLookupCandidates(String normalized) {
        Set<String> out = new LinkedHashSet<>();
        if (normalized == null || normalized.isBlank()) {
            return out;
        }
        String value = normalized.trim();
        out.add(value);

        String noQuery = value.split("\\?")[0].split("#")[0].trim();
        if (!noQuery.isBlank()) {
            out.add(noQuery);
        }

        String[] parts = noQuery.split("/");
        for (int i = parts.length - 1; i >= 0; i--) {
            String p = parts[i] == null ? "" : parts[i].trim();
            if (!p.isBlank()) {
                out.add(p);
                break;
            }
        }

        String lower = value.toLowerCase();
        int marker = lower.indexOf("verify-booking/");
        if (marker >= 0) {
            String tail = value.substring(marker + "verify-booking/".length()).trim();
            if (!tail.isBlank()) {
                String cleanTail = tail.split("[?#]")[0].trim();
                if (!cleanTail.isBlank()) {
                    out.add(cleanTail);
                }
            }
        }

        return out;
    }

    private String safeForLog(String value) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        if (trimmed.length() <= 120) {
            return trimmed;
        }
        return trimmed.substring(0, 120) + "...";
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

        if (!hasValidAvailabilityWindows(resource)) {
            throw new RuntimeException("Selected resource has no valid availability time slots configured");
        }

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

    private void validateSpaceBookingRules(BookingRequest request, Resource resource, LocalTime startTime,
            LocalTime endTime) {
        Integer attendees = request.expectedAttendees();
        if (attendees == null || attendees < 1) {
            throw new RuntimeException("Expected attendees must be greater than 0");
        }
        Integer capacity = resource.getCapacity();
        if (capacity != null && attendees > capacity) {
            throw new RuntimeException("Expected attendees exceed selected resource capacity");
        }
        List<Booking> existing = bookingRepository.findByResource_IdAndBookingDate(resource.getId(),
                request.bookingDate());
        boolean hasConflict = existing.stream()
                .filter(booking -> booking.getStatus() != BookingStatus.REJECTED
                        && booking.getStatus() != BookingStatus.CANCELLED)
                .anyMatch(
                        booking -> timeRangesOverlap(startTime, endTime, booking.getStartTime(), booking.getEndTime()));
        if (hasConflict) {
            throw new RuntimeException("Selected time slot is already booked for this resource");
        }
    }

    private void validateEquipmentBookingRules(BookingRequest request, Resource resource, LocalTime startTime,
            LocalTime endTime) {
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
        if (resource.getCategory() != null)
            return resource.getCategory();
        return resource.getType() == com.example.backend.resource.entity.ResourceType.EQUIPMENT
                ? ResourceCategory.EQUIPMENT
                : ResourceCategory.SPACE;
    }

    private boolean isWithinAvailabilityWindows(Resource resource, LocalTime startTime, LocalTime endTime) {
        List<String> windows = resource.getAvailabilityWindows();
        if (windows == null || windows.isEmpty())
            return false;

        return windows.stream()
                .map(this::parseWindow)
                .filter(Objects::nonNull)
                .anyMatch(window -> !startTime.isBefore(window.start()) && !endTime.isAfter(window.end()));
    }

    private boolean hasValidAvailabilityWindows(Resource resource) {
        List<String> windows = resource.getAvailabilityWindows();
        if (windows == null || windows.isEmpty()) {
            return false;
        }
        return windows.stream()
                .map(this::parseWindow)
                .anyMatch(Objects::nonNull);
    }

    private TimeWindow parseWindow(String rawWindow) {
        if (rawWindow == null || !rawWindow.contains("-"))
            return null;
        String[] parts = rawWindow.trim().split("-");
        if (parts.length != 2)
            return null;
        try {
            LocalTime start = parseTimeFlexible(parts[0].trim());
            LocalTime end = parseTimeFlexible(parts[1].trim());

            // If end is before start, it might be a 12-hour PM ambiguity (e.g. 8:30 - 5:00)
            if (end.isBefore(start) && end.getHour() < 12) {
                end = end.plusHours(12);
            }

            return new TimeWindow(start, end);
        } catch (Exception ex) {
            log.warn("Failed to parse availability window: {}", rawWindow);
            return null;
        }
    }

    private LocalTime parseTimeFlexible(String timeStr) {
        // Replace dot with colon and normalize spacing
        String normalized = timeStr.replace(".", ":").trim();

        // Handle cases like "8:30" (missing leading zero)
        if (normalized.contains(":") && normalized.indexOf(":") == 1) {
            normalized = "0" + normalized;
        }

        // Handle cases like "8" or "17" (missing minutes)
        if (!normalized.contains(":")) {
            if (normalized.length() == 1)
                normalized = "0" + normalized;
            normalized = normalized + ":00";
        }

        return LocalTime.parse(normalized);
    }

    private record TimeWindow(LocalTime start, LocalTime end) {
    }

    private void notifyBookingCreated(Booking booking) {
        if (booking == null) {
            return;
        }
        String studentEmail = booking.getUser() != null ? booking.getUser().getEmail() : null;
        String resourceName = booking.getResource() != null ? safeText(booking.getResource().getName()) : "resource";
        if ("N/A".equals(resourceName)) {
            resourceName = "resource";
        }
        String message = "Your booking for " + resourceName
                + " has been created and is currently in Pending status.";
        notifyUserEmail(studentEmail, message, NotificationType.BOOKING);

        for (User admin : userRepository.findByRole(Role.ADMIN)) {
            notifyUserEmail(admin.getEmail(),
                    "A new booking request has been submitted by "
                            + (booking.getUser() != null ? safeText(booking.getUser().getFullName()) : "a user")
                            + " for " + resourceName + ".",
                    NotificationType.BOOKING);
        }
    }

    private void notifyBookingStatusUpdated(Booking booking) {
        if (booking == null) {
            return;
        }
        String studentEmail = booking.getUser() != null ? booking.getUser().getEmail() : null;
        if (studentEmail == null || studentEmail.isBlank()) {
            return;
        }
        String resourceName = booking.getResource() != null ? safeText(booking.getResource().getName()) : "resource";
        if ("N/A".equals(resourceName)) {
            resourceName = "resource";
        }
        String message;
        if (booking.getStatus() == BookingStatus.APPROVED) {
            message = "Your booking for " + resourceName + " has been approved.";
        } else if (booking.getStatus() == BookingStatus.REJECTED) {
            String reason = booking.getRejectionReason() == null || booking.getRejectionReason().isBlank()
                    ? "Rejected by admin"
                    : booking.getRejectionReason().trim();
            message = "Your booking for " + resourceName + " has been rejected. Reason: " + reason;
        } else {
            String status = booking.getStatus() == null ? "updated" : booking.getStatus().name().toLowerCase();
            message = "Your booking for " + resourceName + " was " + status + ".";
        }
        notifyUserEmail(studentEmail, message, NotificationType.BOOKING);
    }

    private void notifyUserEmail(String userEmail, String message, NotificationType type) {
        if (userEmail == null || userEmail.isBlank() || message == null || message.isBlank()) {
            return;
        }
        try {
            notificationService.createForUser(new CreateNotificationRequest(
                    message,
                    userEmail.trim().toLowerCase(),
                    type));
        } catch (Exception ex) {
            log.warn("Could not create booking notification for {}: {}", userEmail, ex.getMessage());
        }
    }

    private String safeText(String value) {
        if (value == null || value.isBlank()) {
            return "N/A";
        }
        return value.trim();
    }
}
