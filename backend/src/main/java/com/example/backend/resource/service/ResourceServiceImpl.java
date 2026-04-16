package com.example.backend.resource.service;

import com.example.backend.resource.dto.ResourceRequestDto;
import com.example.backend.resource.dto.ResourceResponseDto;
import com.example.backend.resource.entity.Resource;
import com.example.backend.resource.entity.ResourceStatus;
import com.example.backend.resource.entity.ResourceType;
import com.example.backend.resource.mapper.ResourceMapper;
import com.example.backend.resource.repository.ResourceRepository;
import com.example.backend.common.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

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

    @Override
    public ResourceResponseDto createResource(ResourceRequestDto dto, MultipartFile photo) {
        String normalizedLocation = normalizeLocation(dto.getLocation());
        ensureLocationUniqueForCreate(normalizedLocation);
        dto.setLocation(normalizedLocation);
        applyLabDefaultCapacity(dto);
        Resource resource = mapper.toEntity(dto);
        if (photo != null && !photo.isEmpty()) {
            String photoUrl = fileStorageService.storeFile(photo, "resources");
            resource.setPhotoUrl(photoUrl);
        }
        Resource saved = repository.save(resource);
        return mapper.toDto(saved);
    }

    @Override
    public ResourceResponseDto updateResource(String id, ResourceRequestDto dto, MultipartFile photo) {
        Resource existing = repository.findById(id).orElseThrow(() -> new RuntimeException("Resource not found"));
        String normalizedLocation = normalizeLocation(dto.getLocation());
        ensureLocationUniqueForUpdate(normalizedLocation, id);
        applyLabDefaultCapacity(dto);
        existing.setName(dto.getName());
        existing.setType(dto.getType());
        existing.setCapacity(dto.getCapacity());
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
        return mapper.toDto(updated);
    }

    @Override
    public void deleteResource(String id) {
        repository.deleteById(id);
    }

    @Override
    public ResourceResponseDto getResourceById(String id) {
        Resource resource = repository.findById(id).orElseThrow(() -> new RuntimeException("Resource not found"));
        return mapper.toDto(resource);
    }

    @Override
    public List<ResourceResponseDto> getAllResources(ResourceType type, Integer minCapacity, String location, ResourceStatus status) {
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
        List<Resource> resources = mongoTemplate.find(query, Resource.class);
        return resources.stream().map(mapper::toDto).collect(Collectors.toList());
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
}
