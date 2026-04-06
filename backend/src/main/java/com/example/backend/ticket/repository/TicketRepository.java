package com.example.backend.ticket.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.backend.ticket.entity.Ticket;

public interface TicketRepository extends MongoRepository<Ticket, String> {
}
