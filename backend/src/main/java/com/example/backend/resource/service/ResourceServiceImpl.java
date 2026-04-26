package com.example.backend.resource.service;

import com.example.backend.resource.dto.ResourceRequestDto;
import com.example.backend.resource.dto.ResourceResponseDto;
import com.example.backend.resource.entity.Resource;
import com.example.backend.resource.entity.ResourceCategory;
import com.example.backend.resource.entity.ResourceStatus;
import com.example.backend.resource.entity.ResourceType;
import com.example.backend.resource.mapper.ResourceMapper;
import com.example.backend.resource.repository.ResourceRepository;
import com.example.backend.common.service.FileStorageService;
import com.example.backend.notifications.NotificationService;
import com.example.backend.notifications.NotificationType;
import com.example.backend.user.entity.Role;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ResourceServiceImpl implements ResourceService {

    @Autowired
    private ResourceRepository repository;

    @Autowired
    private ResourceMapper mapper;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private NotificationService notificationService;

    @Override
    public ResourceResponseDto createResource(ResourceRequestDto dto, MultipartFile photo) {
        String normalizedLocation = normalizeLocation(dto.getLocation());
        ensureLocationUniqueForCreate(normalizedLocation);
        dto.setLocation(normalizedLocation);
        applyLabDefaultCapacity(dto);
        validateLectureHallCapacity(dto);
        validateAvailabilityWindowsRange(dto);
        Resource resource = mapper.toEntity(dto);
        if (photo != null && !photo.isEmpty()) {
            String photoUrl = fileStorageService.storeFile(photo, "resources");
            resource.setPhotoUrl(photoUrl);
        }
        Resource saved = repository.save(resource);
        notifyResourceAdded(saved);
        return mapper.toDto(saved);
    }

    @Override
    public ResourceResponseDto updateResource(String id, ResourceRequestDto dto, MultipartFile photo) {
        Resource existing = repository.findById(id).orElseThrow(() -> new RuntimeException("Resource not found"));
        ResourceStatus previousStatus = existing.getStatus();
        String normalizedLocation = normalizeLocation(dto.getLocation());
        ensureLocationUniqueForUpdate(normalizedLocation, id);
        applyLabDefaultCapacity(dto);
        validateLectureHallCapacity(dto);
        validateAvailabilityWindowsRange(dto);
        existing.setName(dto.getName());
        existing.setType(dto.getType());
        existing.setCategory(dto.getCategory() != null ? dto.getCategory() : inferCategory(dto.getType()));
        existing.setCapacity(dto.getCapacity());
        existing.setQuantity(dto.getQuantity());
        existing.setLocation(normalizedLocation);
        existing.setAvailabilityWindows(dto.getAvailabilityWindows());
        existing.setStatus(dto.getStatus());
        
        if (photo != null && !photo.isEmpty()) {
            String photoUrl = fileStorageService.storeFile(photo, "resources");
            existing.setPhotoUrl(photoUrl);
        } else if (dto.getPhotoUrl() != null) {
            existing.setPhotoUrl(dto.getPhotoUrl());
        }
        
        Resource updated = repository.save(existing);
        notifyResourceStatusIfCritical(previousStatus, updated.getStatus(), updated);
        return mapper.toDto(updated);
    }

    @Override
    public void deleteResource(String id) {
        Resource existing = repository.findById(id).orElseThrow(() -> new RuntimeException("Resource not found"));
        repository.deleteById(id);
        notifyResourceRemoved(existing);
    }

    @Override
    public ResourceResponseDto getResourceById(String id) {
        Resource resource = repository.findById(id).orElseThrow(() -> new RuntimeException("Resource not found"));
        return mapper.toDto(resource);
    }

    @Override
    public List<ResourceResponseDto> getAllResources(ResourceType type, Integer minCapacity, String location, ResourceStatus status, ResourceCategory category) {
        Query query = new Query();
        if (type != null) {
            query.addCriteria(Criteria.where("type").is(type));
        }
        if (minCapacity != null) {
            query.addCriteria(Criteria.where("capacity").gte(minCapacity));
        }
        if (location != null && !location.isEmpty()) {
            query.addCriteria(Criteria.where("location").regex(location, "i"));
        }
        if (status != null) {
            query.addCriteria(Criteria.where("status").is(status));
        }
        if (category != null) {
            query.addCriteria(Criteria.where("category").is(category));
        }
        List<Resource> resources = mongoTemplate.find(query, Resource.class);
        return resources.stream()
                .filter(resource -> category == null || category.equals(resolveCategory(resource)))
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<ResourceResponseDto> getActiveResourcesByCategory(ResourceCategory category) {
        Query query = new Query();
        query.addCriteria(Criteria.where("status").is(ResourceStatus.ACTIVE));
        List<Resource> resources = mongoTemplate.find(query, Resource.class);
        return resources.stream()
                .filter(resource -> category.equals(resolveCategory(resource)))
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    private String normalizeLocation(String location) {
        if (location == null || location.trim().isEmpty()) {
            throw new RuntimeException("Location is required");
        }
        return location.trim().toUpperCase();
    }

    private void ensureLocationUniqueForCreate(String location) {
        if (repository.existsByLocationIgnoreCase(location)) {
            throw new RuntimeException("Location already exists: " + location);
        }
    }

    private void ensureLocationUniqueForUpdate(String location, String id) {
        if (repository.existsByLocationIgnoreCaseAndIdNot(location, id)) {
            throw new RuntimeException("Location already exists: " + location);
        }
    }

    private void applyLabDefaultCapacity(ResourceRequestDto dto) {
        if (dto.getType() == ResourceType.LAB && dto.getCapacity() == null) {
            dto.setCapacity(60);
        }
    }

    private void validateLectureHallCapacity(ResourceRequestDto dto) {
        if (dto.getType() == ResourceType.LECTURE_HALL) {
            Integer capacity = dto.getCapacity();
            if (capacity == null || capacity <= 50) {
                throw new RuntimeException("Lecture hall capacity must be greater than 50");
            }
        }
    }

    private void validateAvailabilityWindowsRange(ResourceRequestDto dto) {
        List<String> windows = dto.getAvailabilityWindows();
        if (windows == null || windows.isEmpty()) {
            throw new RuntimeException("At least one availability window is required");
        }

        LocalTime dayStart = LocalTime.of(8, 30);
        LocalTime dayEnd = LocalTime.of(17, 30);

        for (String raw : windows) {
            if (raw == null || raw.isBlank()) {
                throw new RuntimeException("Availability window cannot be blank");
            }

            String slot = raw.trim();
            String[] parts = slot.split("-");
            if (parts.length != 2) {
                throw new RuntimeException("Invalid availability window format. Use HH:MM-HH:MM");
            }

            LocalTime start;
            LocalTime end;
            try {
                start = LocalTime.parse(parts[0].trim());
                end = LocalTime.parse(parts[1].trim());
            } catch (Exception ex) {
                throw new RuntimeException("Invalid availability window format. Use HH:MM-HH:MM");
            }

            if (!start.isBefore(end)) {
                throw new RuntimeException("Availability window start time must be before end time");
            }
            if (start.isBefore(dayStart) || end.isAfter(dayEnd)) {
                throw new RuntimeException("Availability windows must be between 08:30 and 17:30");
            }
        }
    }

    private ResourceCategory resolveCategory(Resource resource) {
        if (resource.getCategory() != null) return resource.getCategory();
        return inferCategory(resource.getType());
    }

    private ResourceCategory inferCategory(ResourceType type) {
        if (type == ResourceType.EQUIPMENT) return ResourceCategory.EQUIPMENT;
        return ResourceCategory.SPACE;
    }

    private void notifyResourceAdded(Resource resource) {
        String resourceName = resourceName(resource);
        String message = "A new resource has been added: " + resourceName;
        notifyRoles(List.of(Role.STUDENT, Role.TECHNICIAN), message, NotificationType.RESOURCE);
    }

    private void notifyResourceRemoved(Resource resource) {
        String resourceName = resourceName(resource);
        String message = "Resource has been removed: " + resourceName;
        notifyRoles(List.of(Role.STUDENT, Role.TECHNICIAN), message, NotificationType.RESOURCE);
    }

    private void notifyResourceStatusIfCritical(ResourceStatus previousStatus, ResourceStatus nextStatus, Resource resource) {
        if (nextStatus == null || nextStatus == previousStatus) {
            return;
        }
        if (nextStatus != ResourceStatus.UNDER_MAINTENANCE && nextStatus != ResourceStatus.OUT_OF_SERVICE) {
            return;
        }
        String resourceName = resourceName(resource);
        String suffix = nextStatus == ResourceStatus.UNDER_MAINTENANCE
                ? "under maintenance"
                : "out of service";
        String message = "Resource " + resourceName + " is currently " + suffix + ".";
        notifyRoles(List.of(Role.STUDENT, Role.TECHNICIAN, Role.ADMIN), message, NotificationType.RESOURCE);
    }

    private void notifyRoles(List<Role> roles, String message, NotificationType type) {
        for (Role role : roles) {
            try {
                notificationService.createForRole(role, message, type);
            } catch (Exception ignored) {
                // Do not break core resource workflow if notifications fail.
            }
        }
    }

    private String resourceName(Resource resource) {
        if (resource == null || resource.getName() == null || resource.getName().isBlank()) {
            return "Unknown Resource";
        }
        return resource.getName().trim();
    }
}
