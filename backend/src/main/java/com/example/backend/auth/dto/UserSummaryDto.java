package com.example.backend.auth.dto;

import java.time.Instant;

import com.example.backend.user.Role;

public record UserSummaryDto(String id, String email, String fullName, Role role, Instant createdAt) {
}
