package com.example.backend.incident.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.backend.incident.entity.Incident;
import com.example.backend.incident.entity.IncidentStatus;

public interface IncidentRepository extends MongoRepository<Incident, String> {
	List<Incident> findByUserIdOrderByCreatedAtDesc(String userId);

	List<Incident> findAllByOrderByCreatedAtDesc();

	List<Incident> findByStatusOrderByCreatedAtDesc(IncidentStatus status);
}
