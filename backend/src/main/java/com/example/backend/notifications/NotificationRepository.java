package com.example.backend.notifications;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface NotificationRepository extends MongoRepository<Notification, String> {

	List<Notification> findByUserEmailOrderByCreatedAtDesc(String userEmail);

	long countByUserEmailAndReadAtIsNull(String userEmail);

	Optional<Notification> findByIdAndUserEmail(String id, String userEmail);
}

