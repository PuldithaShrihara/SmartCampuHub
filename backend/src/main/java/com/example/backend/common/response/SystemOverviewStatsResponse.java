package com.example.backend.common.response;

public class SystemOverviewStatsResponse {
	private long totalBookings;
	private long totalResources;
	private long totalTickets;
	private long totalUsers;

	public SystemOverviewStatsResponse(long totalBookings, long totalResources, long totalTickets, long totalUsers) {
		this.totalBookings = totalBookings;
		this.totalResources = totalResources;
		this.totalTickets = totalTickets;
		this.totalUsers = totalUsers;
	}

	public long getTotalBookings() {
		return totalBookings;
	}

	public void setTotalBookings(long totalBookings) {
		this.totalBookings = totalBookings;
	}

	public long getTotalResources() {
		return totalResources;
	}

	public void setTotalResources(long totalResources) {
		this.totalResources = totalResources;
	}

	public long getTotalTickets() {
		return totalTickets;
	}

	public void setTotalTickets(long totalTickets) {
		this.totalTickets = totalTickets;
	}

	public long getTotalUsers() {
		return totalUsers;
	}

	public void setTotalUsers(long totalUsers) {
		this.totalUsers = totalUsers;
	}
}
