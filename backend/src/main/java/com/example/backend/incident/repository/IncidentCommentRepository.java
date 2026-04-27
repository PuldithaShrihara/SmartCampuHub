package com.example.backend.incident.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.backend.incident.entity.IncidentComment;

public interface IncidentCommentRepository extends MongoRepository<IncidentComment, String> {
	List<IncidentComment> findByIncidentIdOrderByCreatedAtAsc(String incidentId);

	Optional<IncidentComment> findByIdAndIncidentId(String id, String incidentId);
}
