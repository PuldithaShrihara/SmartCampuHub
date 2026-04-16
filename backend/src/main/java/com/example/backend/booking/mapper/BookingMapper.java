package com.example.backend.booking.mapper;

import org.springframework.stereotype.Component;

import com.example.backend.booking.dto.BookingRequest;
import com.example.backend.booking.dto.BookingResponse;
import com.example.backend.booking.entity.Booking;
import com.example.backend.booking.entity.BookingStatus;
import com.example.backend.booking.entity.BookingType;
import com.example.backend.resource.entity.Resource;
import com.example.backend.resource.entity.ResourceCategory;
import com.example.backend.user.entity.User;

@Component
public class BookingMapper {

    public Booking toEntity(BookingRequest request, User user, Resource resource) {
        Booking booking = new Booking();
        booking.setUser(user);
        booking.setResource(resource);
        booking.setBookingType(request.bookingType());
        booking.setBookingDate(request.bookingDate());
        booking.setStartTime(request.startTime());
        booking.setEndTime(request.endTime());
        booking.setPurpose(request.purpose());
        booking.setExpectedAttendees(request.expectedAttendees());
        booking.setQuantityRequested(request.quantityRequested());
        booking.setNotes(request.notes());
        booking.setStatus(BookingStatus.PENDING);
        return booking;
    }

    public BookingResponse toResponse(Booking booking) {
        Resource resource = booking.getResource();
        User user = booking.getUser();

        return new BookingResponse(
                booking.getId(),
                resource != null ? resource.getId() : null,
                resource != null ? resource.getName() : "Deleted Resource",
                (resource != null && resource.getType() != null) ? resource.getType().name() : null,
                resource != null ? resolveCategory(resource).name() : null,
                user != null ? user.getId() : null,
                user != null ? user.getFullName() : "Deleted User",
                booking.getBookingType(),
                booking.getBookingDate(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getPurpose(),
                booking.getExpectedAttendees(),
                booking.getQuantityRequested(),
                booking.getNotes(),
                booking.getStatus(),
                booking.getRejectionReason(),
                booking.getCancelReason(),
                booking.getCreatedAt(),
                booking.getUpdatedAt());
    }

    private ResourceCategory resolveCategory(Resource resource) {
        if (resource.getCategory() != null) return resource.getCategory();
        return resource.getType() == com.example.backend.resource.entity.ResourceType.EQUIPMENT
                ? ResourceCategory.EQUIPMENT
                : ResourceCategory.SPACE;
    }
}
