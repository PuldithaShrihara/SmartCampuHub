package com.example.backend.resource.controller;

import com.example.backend.resource.dto.ResourceRequestDto;
import com.example.backend.resource.dto.ResourceResponseDto;
import com.example.backend.resource.entity.ResourceStatus;
import com.example.backend.resource.entity.ResourceType;
import com.example.backend.resource.service.ResourceService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    @Autowired
    private ResourceService resourceService;

    @GetMapping
    public ResponseEntity<List<ResourceResponseDto>> getAllResources(
            @RequestParam(required = false) ResourceType type,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) ResourceStatus status) {
        return ResponseEntity.ok(resourceService.getAllResources(type, minCapacity, location, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResourceResponseDto> getResourceById(@PathVariable String id) {
        return ResponseEntity.ok(resourceService.getResourceById(id));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResourceResponseDto> createResource(
            @RequestPart("data") @Valid ResourceRequestDto dto,
            @RequestPart(value = "photo", required = false) MultipartFile photo) {
        return ResponseEntity.ok(resourceService.createResource(dto, photo));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResourceResponseDto> updateResource(
            @PathVariable String id,
            @RequestPart("data") @Valid ResourceRequestDto dto,
            @RequestPart(value = "photo", required = false) MultipartFile photo) {
        return ResponseEntity.ok(resourceService.updateResource(id, dto, photo));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable String id) {
        resourceService.deleteResource(id);
        return ResponseEntity.noContent().build();
    }
}
