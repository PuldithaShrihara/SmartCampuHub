package com.example.backend.user.dto.me;

import java.time.Instant;

import com.example.backend.user.entity.Role;

/**
 * Profile + preferences snapshot returned by {@code GET /api/me}.
 */
public record MeProfileDto(
		String id,
		String email,
		String fullName,
		Role role,
		String avatarUrl,
		Instant createdAt,
		Instant lastLoginAt,
		Boolean verified,
		boolean googleLinked,
		boolean hasPassword,
		boolean deletionRequested,
		UserPreferencesDto preferences) {
}
