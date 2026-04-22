package com.example.backend.resource.service;

import com.example.backend.resource.dto.ResourceRequestDto;
import com.example.backend.resource.dto.ResourceResponseDto;
import com.example.backend.resource.entity.ResourceCategory;
import com.example.backend.resource.entity.ResourceStatus;
import com.example.backend.resource.entity.ResourceType;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ResourceService {
    ResourceResponseDto createResource(ResourceRequestDto dto, MultipartFile photo);
    ResourceResponseDto updateResource(String id, ResourceRequestDto dto, MultipartFile photo);
    void deleteResource(String id);
    ResourceResponseDto getResourceById(String id);
    List<ResourceResponseDto> getAllResources(ResourceType type, Integer minCapacity, String location, ResourceStatus status, ResourceCategory category);
    List<ResourceResponseDto> getActiveResourcesByCategory(ResourceCategory category);
}
