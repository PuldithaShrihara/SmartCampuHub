package com.example.backend.resource.mapper;

import com.example.backend.resource.dto.ResourceRequestDto;
import com.example.backend.resource.dto.ResourceResponseDto;
import com.example.backend.resource.entity.Resource;
import com.example.backend.resource.entity.ResourceCategory;
import com.example.backend.resource.entity.ResourceType;
import org.springframework.stereotype.Component;

@Component
public class ResourceMapper {
    public Resource toEntity(ResourceRequestDto dto) {
        Resource resource = new Resource();
        resource.setName(dto.getName());
        resource.setType(dto.getType());
        resource.setCategory(dto.getCategory() != null ? dto.getCategory() : inferCategory(dto.getType()));
        resource.setCapacity(dto.getCapacity());
        resource.setQuantity(dto.getQuantity());
        resource.setLocation(dto.getLocation());
        resource.setAvailabilityWindows(dto.getAvailabilityWindows());
        resource.setStatus(dto.getStatus());
        resource.setPhotoUrl(dto.getPhotoUrl());
        return resource;
    }

    public ResourceResponseDto toDto(Resource resource) {
        ResourceResponseDto dto = new ResourceResponseDto();
        dto.setId(resource.getId());
        dto.setName(resource.getName());
        dto.setType(resource.getType());
        dto.setCategory(resource.getCategory() != null ? resource.getCategory() : inferCategory(resource.getType()));
        dto.setCapacity(resource.getCapacity());
        dto.setQuantity(resource.getQuantity());
        dto.setLocation(resource.getLocation());
        dto.setAvailabilityWindows(resource.getAvailabilityWindows());
        dto.setStatus(resource.getStatus());
        dto.setPhotoUrl(resource.getPhotoUrl());
        return dto;
    }

    private ResourceCategory inferCategory(ResourceType type) {
        if (type == ResourceType.EQUIPMENT) return ResourceCategory.EQUIPMENT;
        return ResourceCategory.SPACE;
    }
}
