package com.example.backend.user.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.common.response.SystemOverviewStatsResponse;
import com.example.backend.user.service.DashboardService;

@RestController
@RequestMapping("/api/stats")
public class SystemStatsController {

	private final DashboardService dashboardService;

	public SystemStatsController(DashboardService dashboardService) {
		this.dashboardService = dashboardService;
	}

	@GetMapping("/overview")
	public SystemOverviewStatsResponse getOverview() {
		return dashboardService.getSystemOverviewStats();
	}
}
