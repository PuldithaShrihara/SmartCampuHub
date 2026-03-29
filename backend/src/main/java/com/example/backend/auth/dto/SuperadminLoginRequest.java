package com.example.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SuperadminLoginRequest(
		@NotBlank String email,
		@NotBlank @Size(max = 72) String password) {
}
