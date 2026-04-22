package com.example.backend.common.response;

import java.time.Instant;
import java.util.List;

public class AiResourceInsightsResponse {
    private Instant generatedAt;
    private List<DemandPrediction> highDemandPredictions;
    private List<UnderutilizedResource> underutilizedResources;
    private UsageTrends usageTrends;
    private List<ActionableRecommendation> actionableRecommendations;

    public AiResourceInsightsResponse() {
    }

    public AiResourceInsightsResponse(Instant generatedAt,
                                      List<DemandPrediction> highDemandPredictions,
                                      List<UnderutilizedResource> underutilizedResources,
                                      UsageTrends usageTrends,
                                      List<ActionableRecommendation> actionableRecommendations) {
        this.generatedAt = generatedAt;
        this.highDemandPredictions = highDemandPredictions;
        this.underutilizedResources = underutilizedResources;
        this.usageTrends = usageTrends;
        this.actionableRecommendations = actionableRecommendations;
    }

    public Instant getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(Instant generatedAt) {
        this.generatedAt = generatedAt;
    }

    public List<DemandPrediction> getHighDemandPredictions() {
        return highDemandPredictions;
    }

    public void setHighDemandPredictions(List<DemandPrediction> highDemandPredictions) {
        this.highDemandPredictions = highDemandPredictions;
    }

    public List<UnderutilizedResource> getUnderutilizedResources() {
        return underutilizedResources;
    }

    public void setUnderutilizedResources(List<UnderutilizedResource> underutilizedResources) {
        this.underutilizedResources = underutilizedResources;
    }

    public UsageTrends getUsageTrends() {
        return usageTrends;
    }

    public void setUsageTrends(UsageTrends usageTrends) {
        this.usageTrends = usageTrends;
    }

    public List<ActionableRecommendation> getActionableRecommendations() {
        return actionableRecommendations;
    }

    public void setActionableRecommendations(List<ActionableRecommendation> actionableRecommendations) {
        this.actionableRecommendations = actionableRecommendations;
    }

    public static class DemandPrediction {
        private String resourceId;
        private String resourceName;
        private String location;
        private String resourceType;
        private String likelyWindow;
        private String riskLevel;
        private double confidence;
        private long averageRequests;

        public DemandPrediction() {
        }

        public DemandPrediction(String resourceId, String resourceName, String location, String resourceType,
                                String likelyWindow, String riskLevel, double confidence, long averageRequests) {
            this.resourceId = resourceId;
            this.resourceName = resourceName;
            this.location = location;
            this.resourceType = resourceType;
            this.likelyWindow = likelyWindow;
            this.riskLevel = riskLevel;
            this.confidence = confidence;
            this.averageRequests = averageRequests;
        }

        public String getResourceId() {
            return resourceId;
        }

        public void setResourceId(String resourceId) {
            this.resourceId = resourceId;
        }

        public String getResourceName() {
            return resourceName;
        }

        public void setResourceName(String resourceName) {
            this.resourceName = resourceName;
        }

        public String getLocation() {
            return location;
        }

        public void setLocation(String location) {
            this.location = location;
        }

        public String getResourceType() {
            return resourceType;
        }

        public void setResourceType(String resourceType) {
            this.resourceType = resourceType;
        }

        public String getLikelyWindow() {
            return likelyWindow;
        }

        public void setLikelyWindow(String likelyWindow) {
            this.likelyWindow = likelyWindow;
        }

        public String getRiskLevel() {
            return riskLevel;
        }

        public void setRiskLevel(String riskLevel) {
            this.riskLevel = riskLevel;
        }

        public double getConfidence() {
            return confidence;
        }

        public void setConfidence(double confidence) {
            this.confidence = confidence;
        }

        public long getAverageRequests() {
            return averageRequests;
        }

        public void setAverageRequests(long averageRequests) {
            this.averageRequests = averageRequests;
        }
    }

    public static class UnderutilizedResource {
        private String resourceId;
        private String resourceName;
        private String location;
        private String resourceType;
        private double utilizationRate;
        private long approvedBookings;

        public UnderutilizedResource() {
        }

        public UnderutilizedResource(String resourceId, String resourceName, String location, String resourceType,
                                     double utilizationRate, long approvedBookings) {
            this.resourceId = resourceId;
            this.resourceName = resourceName;
            this.location = location;
            this.resourceType = resourceType;
            this.utilizationRate = utilizationRate;
            this.approvedBookings = approvedBookings;
        }

        public String getResourceId() {
            return resourceId;
        }

        public void setResourceId(String resourceId) {
            this.resourceId = resourceId;
        }

        public String getResourceName() {
            return resourceName;
        }

        public void setResourceName(String resourceName) {
            this.resourceName = resourceName;
        }

        public String getLocation() {
            return location;
        }

        public void setLocation(String location) {
            this.location = location;
        }

        public String getResourceType() {
            return resourceType;
        }

        public void setResourceType(String resourceType) {
            this.resourceType = resourceType;
        }

        public double getUtilizationRate() {
            return utilizationRate;
        }

        public void setUtilizationRate(double utilizationRate) {
            this.utilizationRate = utilizationRate;
        }

        public long getApprovedBookings() {
            return approvedBookings;
        }

        public void setApprovedBookings(long approvedBookings) {
            this.approvedBookings = approvedBookings;
        }
    }

    public static class UsageTrends {
        private long currentWeekBookings;
        private long previousWeekBookings;
        private double weeklyDemandChangePct;
        private String peakDay;
        private String peakWindow;

        public UsageTrends() {
        }

        public UsageTrends(long currentWeekBookings, long previousWeekBookings, double weeklyDemandChangePct,
                           String peakDay, String peakWindow) {
            this.currentWeekBookings = currentWeekBookings;
            this.previousWeekBookings = previousWeekBookings;
            this.weeklyDemandChangePct = weeklyDemandChangePct;
            this.peakDay = peakDay;
            this.peakWindow = peakWindow;
        }

        public long getCurrentWeekBookings() {
            return currentWeekBookings;
        }

        public void setCurrentWeekBookings(long currentWeekBookings) {
            this.currentWeekBookings = currentWeekBookings;
        }

        public long getPreviousWeekBookings() {
            return previousWeekBookings;
        }

        public void setPreviousWeekBookings(long previousWeekBookings) {
            this.previousWeekBookings = previousWeekBookings;
        }

        public double getWeeklyDemandChangePct() {
            return weeklyDemandChangePct;
        }

        public void setWeeklyDemandChangePct(double weeklyDemandChangePct) {
            this.weeklyDemandChangePct = weeklyDemandChangePct;
        }

        public String getPeakDay() {
            return peakDay;
        }

        public void setPeakDay(String peakDay) {
            this.peakDay = peakDay;
        }

        public String getPeakWindow() {
            return peakWindow;
        }

        public void setPeakWindow(String peakWindow) {
            this.peakWindow = peakWindow;
        }
    }

    public static class ActionableRecommendation {
        private String priority;
        private String title;
        private String action;
        private String reason;

        public ActionableRecommendation() {
        }

        public ActionableRecommendation(String priority, String title, String action, String reason) {
            this.priority = priority;
            this.title = title;
            this.action = action;
            this.reason = reason;
        }

        public String getPriority() {
            return priority;
        }

        public void setPriority(String priority) {
            this.priority = priority;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getAction() {
            return action;
        }

        public void setAction(String action) {
            this.action = action;
        }

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }
    }
}
