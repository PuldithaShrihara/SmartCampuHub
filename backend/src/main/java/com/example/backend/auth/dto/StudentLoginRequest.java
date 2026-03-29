package com.example.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record StudentLoginRequest(
		@NotBlank @Email String email,
		@NotBlank @Size(max = 72) String password) {
}
