package com.example.backend.ticket.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.backend.ticket.entity.TicketComment;

public interface TicketCommentRepository extends MongoRepository<TicketComment, String> {
}
