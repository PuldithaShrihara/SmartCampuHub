package com.example.backend.user.service;

import com.example.backend.booking.entity.Booking;
import com.example.backend.booking.entity.BookingStatus;
import com.example.backend.booking.repository.BookingRepository;
import com.example.backend.common.response.DashboardStatsResponse;
import com.example.backend.common.response.SystemOverviewStatsResponse;
import com.example.backend.resource.repository.ResourceRepository;
import com.example.backend.user.repository.UserRepository;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DashboardServiceImpl implements DashboardService {

    private final ResourceRepository resourceRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final MongoTemplate mongoTemplate;

    public DashboardServiceImpl(ResourceRepository resourceRepository,
                                BookingRepository bookingRepository,
                                UserRepository userRepository,
                                MongoTemplate mongoTemplate) {
        this.resourceRepository = resourceRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.mongoTemplate = mongoTemplate;
    }

    /** Raw document counts from MongoDB collections (matches Compass / atlas). */
    private long countCollection(String collectionName) {
        return mongoTemplate.getCollection(collectionName).countDocuments();
    }

    @Override
    public DashboardStatsResponse getDashboardStats() {
        long totalResources = resourceRepository.count();
        long totalBookings = bookingRepository.count();
        long pendingApprovals = bookingRepository.countByStatus(BookingStatus.PENDING);
        long totalUsers = userRepository.count();

        return new DashboardStatsResponse(totalResources, totalBookings, pendingApprovals, totalUsers);
    }

    @Override
    public List<Booking> getRecentPendingBookings() {
        return bookingRepository.findTop5ByStatusOrderByCreatedAtDesc(BookingStatus.PENDING);
    }

    @Override
    public SystemOverviewStatsResponse getSystemOverviewStats() {
        long totalBookings = countCollection("bookings");
        long totalResources = countCollection("resources");
        long totalIncidents = countCollection("incidents");
        long totalSupportTickets = countCollection("tickets");
        long totalTickets = totalIncidents + totalSupportTickets;
        long totalUsers = countCollection("users");
        return new SystemOverviewStatsResponse(totalBookings, totalResources, totalTickets, totalUsers);
    }
}
