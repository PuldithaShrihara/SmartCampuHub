package com.example.backend.user.service;

import com.example.backend.booking.entity.Booking;
import com.example.backend.booking.entity.BookingStatus;
import com.example.backend.booking.repository.BookingRepository;
import com.example.backend.common.response.AiResourceInsightsResponse;
import com.example.backend.common.response.DashboardStatsResponse;
import com.example.backend.common.response.SystemOverviewStatsResponse;
import com.example.backend.resource.entity.Resource;
import com.example.backend.resource.repository.ResourceRepository;
import com.example.backend.user.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class DashboardServiceImpl implements DashboardService {

    private final ResourceRepository resourceRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final MongoTemplate mongoTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Value("${app.ai.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${app.ai.gemini.model:gemini-1.5-flash}")
    private String geminiModel;

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
    public AiResourceInsightsResponse getAiResourceInsights(int periodDays) {
        int safePeriod = Math.max(7, Math.min(90, periodDays));
        LocalDate today = LocalDate.now();
        LocalDate fromDate = today.minusDays(safePeriod - 1L);

        List<Booking> allBookings = bookingRepository.findAll();
        List<Resource> resources = resourceRepository.findAll();
        Map<String, Resource> resourceById = resources.stream()
                .filter(resource -> resource.getId() != null)
                .collect(Collectors.toMap(Resource::getId, value -> value, (a, b) -> a));

        List<Booking> filteredBookings = allBookings.stream()
                .filter(this::isRelevantBooking)
                .filter(booking -> booking.getBookingDate() != null)
                .filter(booking -> !booking.getBookingDate().isBefore(fromDate))
                .filter(booking -> booking.getResource() != null)
                .filter(booking -> booking.getResource().getId() != null)
                .collect(Collectors.toList());

        AiResourceInsightsResponse baseline = buildRuleBasedInsights(filteredBookings, resourceById, today);
        AiResourceInsightsResponse aiEnhanced = tryGeminiEnhancement(filteredBookings, resourceById, safePeriod, baseline);
        return aiEnhanced != null ? aiEnhanced : baseline;
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

    private AiResourceInsightsResponse buildRuleBasedInsights(List<Booking> bookings,
                                                              Map<String, Resource> resourceById,
                                                              LocalDate today) {
        Map<String, Long> bookingCountByResource = new HashMap<>();
        Map<String, Long> approvedByResource = new HashMap<>();
        Map<String, Long> slotCount = new HashMap<>();

        for (Booking booking : bookings) {
            String resourceId = booking.getResource().getId();
            bookingCountByResource.merge(resourceId, 1L, Long::sum);
            if (booking.getStatus() == BookingStatus.APPROVED) {
                approvedByResource.merge(resourceId, 1L, Long::sum);
            }
            String slot = formatSlotKey(booking.getBookingDate(), booking.getStartTime());
            slotCount.merge(slot, 1L, Long::sum);
        }

        List<AiResourceInsightsResponse.DemandPrediction> demand = bookingCountByResource.entrySet().stream()
                .map(entry -> {
                    Resource r = resourceById.get(entry.getKey());
                    String peakSlot = findPeakSlotForResource(bookings, entry.getKey());
                    long demandCount = entry.getValue();
                    String risk = demandCount >= 8 ? "HIGH" : demandCount >= 4 ? "MEDIUM" : "LOW";
                    return new AiResourceInsightsResponse.DemandPrediction(
                            entry.getKey(),
                            r != null ? safeText(r.getName(), "Unknown Resource") : "Unknown Resource",
                            r != null ? safeText(r.getLocation(), "N/A") : "N/A",
                            r != null && r.getType() != null ? r.getType().name() : "N/A",
                            peakSlot,
                            risk,
                            round(Math.min(0.95, 0.5 + demandCount / 20.0)),
                            demandCount
                    );
                })
                .sorted(Comparator.comparing(AiResourceInsightsResponse.DemandPrediction::getAverageRequests).reversed())
                .limit(3)
                .collect(Collectors.toList());

        long maxApproved = Math.max(1L, approvedByResource.values().stream().mapToLong(v -> v).max().orElse(1L));
        List<AiResourceInsightsResponse.UnderutilizedResource> under = resourceById.values().stream()
                .map(resource -> {
                    long approved = approvedByResource.getOrDefault(resource.getId(), 0L);
                    double util = approved / (double) maxApproved;
                    return new AiResourceInsightsResponse.UnderutilizedResource(
                            resource.getId(),
                            safeText(resource.getName(), "Unknown Resource"),
                            safeText(resource.getLocation(), "N/A"),
                            resource.getType() != null ? resource.getType().name() : "N/A",
                            round(util),
                            approved
                    );
                })
                .sorted(Comparator.comparing(AiResourceInsightsResponse.UnderutilizedResource::getUtilizationRate))
                .limit(3)
                .collect(Collectors.toList());

        LocalDate weekStart = today.minusDays(6);
        LocalDate prevWeekStart = weekStart.minusDays(7);
        LocalDate prevWeekEnd = weekStart.minusDays(1);
        long currentWeek = bookings.stream()
                .filter(booking -> !booking.getBookingDate().isBefore(weekStart))
                .count();
        long previousWeek = bookings.stream()
                .filter(booking -> !booking.getBookingDate().isBefore(prevWeekStart))
                .filter(booking -> !booking.getBookingDate().isAfter(prevWeekEnd))
                .count();
        double changePct = previousWeek == 0 ? (currentWeek > 0 ? 100 : 0) : ((currentWeek - previousWeek) * 100.0 / previousWeek);
        String topSlot = slotCount.entrySet().stream().max(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse("Monday 09:00-10:00");
        String[] split = topSlot.split(" ");
        AiResourceInsightsResponse.UsageTrends trends = new AiResourceInsightsResponse.UsageTrends(
                currentWeek,
                previousWeek,
                round(changePct),
                split.length > 0 ? split[0] : "Monday",
                split.length > 1 ? split[1] : "09:00-10:00"
        );

        List<AiResourceInsightsResponse.ActionableRecommendation> recommendations = new ArrayList<>();
        if (!demand.isEmpty()) {
            AiResourceInsightsResponse.DemandPrediction top = demand.get(0);
            recommendations.add(new AiResourceInsightsResponse.ActionableRecommendation(
                    "HIGH",
                    "Anticipated overbooking: " + top.getResourceName(),
                    "Add a same-type backup resource or extend slots around " + top.getLikelyWindow() + ".",
                    "Demand is " + top.getAverageRequests() + " bookings in peak window with " + top.getRiskLevel() + " risk."
            ));
        }
        if (!under.isEmpty()) {
            AiResourceInsightsResponse.UnderutilizedResource low = under.get(0);
            recommendations.add(new AiResourceInsightsResponse.ActionableRecommendation(
                    "MEDIUM",
                    "Underused asset: " + low.getResourceName(),
                    "Reallocate this resource to busier periods or promote its availability.",
                    "Utilization is currently " + Math.round(low.getUtilizationRate() * 100) + "%."
            ));
        }
        if (recommendations.isEmpty()) {
            recommendations.add(new AiResourceInsightsResponse.ActionableRecommendation(
                    "LOW",
                    "Stable utilization",
                    "Keep current allocation and continue monitoring weekly.",
                    "No strong overbooking or underutilization signals detected."
            ));
        }

        return new AiResourceInsightsResponse(Instant.now(), demand, under, trends, recommendations);
    }

    private AiResourceInsightsResponse tryGeminiEnhancement(List<Booking> bookings,
                                                            Map<String, Resource> resourceById,
                                                            int period,
                                                            AiResourceInsightsResponse fallback) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return null;
        }
        try {
            String prompt = buildGeminiPrompt(bookings, resourceById, period, fallback);
            String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/"
                    + geminiModel + ":generateContent?key=" + geminiApiKey;

            String requestBody = objectMapper.createObjectNode()
                    .putArray("contents")
                    .add(objectMapper.createObjectNode()
                            .putArray("parts")
                            .add(objectMapper.createObjectNode().put("text", prompt)))
                    .toString();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return null;
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
            if (textNode.isMissingNode() || textNode.asText().isBlank()) {
                return null;
            }

            String jsonText = stripCodeFences(textNode.asText());
            AiResourceInsightsResponse parsed = objectMapper.readValue(jsonText, AiResourceInsightsResponse.class);
            if (parsed.getGeneratedAt() == null) {
                parsed.setGeneratedAt(Instant.now());
            }
            if (parsed.getHighDemandPredictions() == null) {
                parsed.setHighDemandPredictions(fallback.getHighDemandPredictions());
            }
            if (parsed.getUnderutilizedResources() == null) {
                parsed.setUnderutilizedResources(fallback.getUnderutilizedResources());
            }
            if (parsed.getUsageTrends() == null) {
                parsed.setUsageTrends(fallback.getUsageTrends());
            }
            if (parsed.getActionableRecommendations() == null || parsed.getActionableRecommendations().isEmpty()) {
                parsed.setActionableRecommendations(fallback.getActionableRecommendations());
            }
            return parsed;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return null;
        } catch (IOException | RuntimeException ex) {
            return null;
        }
    }

    private String buildGeminiPrompt(List<Booking> bookings,
                                     Map<String, Resource> resourceById,
                                     int period,
                                     AiResourceInsightsResponse fallback) throws IOException {
        List<Map<String, Object>> bookingRows = bookings.stream()
                .limit(350)
                .map(booking -> {
                    Map<String, Object> row = new HashMap<>();
                    String resourceId = booking.getResource().getId();
                    Resource resource = resourceById.get(resourceId);
                    row.put("resourceId", resourceId);
                    row.put("resourceName", resource != null ? safeText(resource.getName(), "Unknown Resource") : "Unknown Resource");
                    row.put("resourceLocation", resource != null ? safeText(resource.getLocation(), "N/A") : "N/A");
                    row.put("resourceType", resource != null && resource.getType() != null ? resource.getType().name() : "N/A");
                    row.put("bookingDate", booking.getBookingDate().toString());
                    row.put("startTime", booking.getStartTime() != null ? booking.getStartTime().toString() : "00:00");
                    row.put("endTime", booking.getEndTime() != null ? booking.getEndTime().toString() : "00:00");
                    row.put("status", booking.getStatus() != null ? booking.getStatus().name() : "UNKNOWN");
                    return row;
                })
                .collect(Collectors.toList());

        String fallbackJson = objectMapper.writeValueAsString(fallback);
        String bookingJson = objectMapper.writeValueAsString(bookingRows);
        return "You are an analytics assistant for a campus booking system.\n"
                + "Use the booking history to generate JSON insights for admins.\n"
                + "Return ONLY valid JSON with this exact structure:\n"
                + "{\n"
                + "  \"generatedAt\": \"ISO-8601 timestamp\",\n"
                + "  \"highDemandPredictions\": [{\"resourceId\":\"\",\"resourceName\":\"\",\"location\":\"\",\"resourceType\":\"\",\"likelyWindow\":\"Tue 10:00-11:00\",\"riskLevel\":\"HIGH|MEDIUM|LOW\",\"confidence\":0.0,\"averageRequests\":0}],\n"
                + "  \"underutilizedResources\": [{\"resourceId\":\"\",\"resourceName\":\"\",\"location\":\"\",\"resourceType\":\"\",\"utilizationRate\":0.0,\"approvedBookings\":0}],\n"
                + "  \"usageTrends\": {\"currentWeekBookings\":0,\"previousWeekBookings\":0,\"weeklyDemandChangePct\":0.0,\"peakDay\":\"Monday\",\"peakWindow\":\"10:00-11:00\"},\n"
                + "  \"actionableRecommendations\": [{\"priority\":\"HIGH|MEDIUM|LOW\",\"title\":\"\",\"action\":\"\",\"reason\":\"\"}]\n"
                + "}\n"
                + "Rules:\n"
                + "- Analyze patterns by day and hour and resource type.\n"
                + "- Keep highDemandPredictions max 3 items.\n"
                + "- Keep underutilizedResources max 3 items.\n"
                + "- Keep actionableRecommendations max 4 items with concrete instructions.\n"
                + "- Prefer recommendations like adding same resource or extending slots when overbooked.\n"
                + "- If data is insufficient, still return valid JSON and use provided fallback trends.\n"
                + "PeriodDays: " + period + "\n"
                + "BookingsData: " + bookingJson + "\n"
                + "FallbackSummary: " + fallbackJson + "\n";
    }

    private String stripCodeFences(String text) {
        String trimmed = text.trim();
        if (trimmed.startsWith("```")) {
            int firstNewLine = trimmed.indexOf('\n');
            int lastFence = trimmed.lastIndexOf("```");
            if (firstNewLine > -1 && lastFence > firstNewLine) {
                return trimmed.substring(firstNewLine + 1, lastFence).trim();
            }
        }
        return trimmed;
    }

    private String findPeakSlotForResource(List<Booking> bookings, String resourceId) {
        Map<String, Long> counts = bookings.stream()
                .filter(booking -> booking.getResource() != null)
                .filter(booking -> Objects.equals(booking.getResource().getId(), resourceId))
                .collect(Collectors.groupingBy(
                        booking -> formatSlotKey(booking.getBookingDate(), booking.getStartTime()),
                        Collectors.counting()
                ));
        return counts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("Monday 09:00-10:00");
    }

    private String formatSlotKey(LocalDate date, LocalTime startTime) {
        DayOfWeek day = date != null ? date.getDayOfWeek() : DayOfWeek.MONDAY;
        LocalTime start = startTime != null ? startTime : LocalTime.of(9, 0);
        LocalTime end = start.plusHours(1);
        String dayText = day.getDisplayName(TextStyle.FULL, Locale.US);
        return String.format(Locale.US, "%s %02d:00-%02d:00", dayText, start.getHour(), end.getHour());
    }

    private boolean isRelevantBooking(Booking booking) {
        if (booking == null || booking.getStatus() == null) {
            return false;
        }
        return booking.getStatus() == BookingStatus.APPROVED
                || booking.getStatus() == BookingStatus.PENDING
                || booking.getStatus() == BookingStatus.REJECTED;
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private String safeText(String value, String fallback) {
        if (value == null || value.trim().isEmpty()) {
            return fallback;
        }
        return value.trim();
    }
}
