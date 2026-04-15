package com.example.backend.resource.mapper;

import com.example.backend.resource.dto.ResourceRequestDto;
import com.example.backend.resource.dto.ResourceResponseDto;
import com.example.backend.resource.entity.Resource;
import org.springframework.stereotype.Component;

@Component
public class ResourceMapper {
    public Resource toEntity(ResourceRequestDto dto) {
        Resource resource = new Resource();
        resource.setName(dto.getName());
        resource.setType(dto.getType());
        resource.setCapacity(dto.getCapacity());
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
        dto.setCapacity(resource.getCapacity());
        dto.setLocation(resource.getLocation());
        dto.setAvailabilityWindows(resource.getAvailabilityWindows());
        dto.setStatus(resource.getStatus());
        dto.setPhotoUrl(resource.getPhotoUrl());
        return dto;
    }
}
