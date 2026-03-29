package com.example.backend.auth;

import com.example.backend.user.Role;

public record AuthResponse(String accessToken, String tokenType, String email, String fullName, Role role) {

	public static AuthResponse of(String accessToken, String email, String fullName, Role role) {
		return new AuthResponse(accessToken, "Bearer", email, fullName, role);
	}

}
