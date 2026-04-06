package com.example.backend.resource.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.backend.resource.entity.Resource;

public interface ResourceRepository extends MongoRepository<Resource, String> {
}
