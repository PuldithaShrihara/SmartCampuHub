package com.example.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record StudentGoogleLoginRequest(
		@NotBlank @Size(max = 8192) String idToken) {
}
