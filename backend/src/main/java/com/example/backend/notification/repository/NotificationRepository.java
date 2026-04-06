package com.example.backend.notification.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.backend.notification.entity.Notification;

public interface NotificationRepository extends MongoRepository<Notification, String> {
}
