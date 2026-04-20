package com.example.backend.user.service;

import com.example.backend.common.response.DashboardStatsResponse;
import com.example.backend.common.response.SystemOverviewStatsResponse;
import com.example.backend.booking.entity.Booking;
import java.util.List;

public interface DashboardService {
    DashboardStatsResponse getDashboardStats();
    List<Booking> getRecentPendingBookings();

    SystemOverviewStatsResponse getSystemOverviewStats();
}
