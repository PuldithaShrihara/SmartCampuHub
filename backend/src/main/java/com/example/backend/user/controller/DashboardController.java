package com.example.backend.user.controller;

import com.example.backend.booking.entity.Booking;
import com.example.backend.common.response.DashboardStatsResponse;
import com.example.backend.user.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/stats")
    public DashboardStatsResponse getStats() {
        return dashboardService.getDashboardStats();
    }

    @GetMapping("/recent-pending")
    public List<Booking> getRecentPending() {
        return dashboardService.getRecentPendingBookings();
    }
}
