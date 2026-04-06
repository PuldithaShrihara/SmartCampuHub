package com.example.backend.auth.dto;

import com.example.backend.user.entity.Role;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateUserByAdminRequest(
		@NotBlank @Size(max = 120) String fullName,
		@NotBlank @Email String email,
		@NotBlank @Size(min = 8, max = 72) String password,
		@NotNull Role role) {
}

