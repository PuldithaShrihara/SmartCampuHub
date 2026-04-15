package com.example.backend.common.response;

public class DashboardStatsResponse {
    private long totalResources;
    private long totalBookings;
    private long pendingApprovals;
    private long totalUsers;

    public DashboardStatsResponse(long totalResources, long totalBookings, long pendingApprovals, long totalUsers) {
        this.totalResources = totalResources;
        this.totalBookings = totalBookings;
        this.pendingApprovals = pendingApprovals;
        this.totalUsers = totalUsers;
    }

    // Getters and Setters
    public long getTotalResources() { return totalResources; }
    public void setTotalResources(long totalResources) { this.totalResources = totalResources; }

    public long getTotalBookings() { return totalBookings; }
    public void setTotalBookings(long totalBookings) { this.totalBookings = totalBookings; }

    public long getPendingApprovals() { return pendingApprovals; }
    public void setPendingApprovals(long pendingApprovals) { this.pendingApprovals = pendingApprovals; }

    public long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }
}
