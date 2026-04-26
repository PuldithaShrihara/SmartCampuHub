package com.example.backend.user.dto.me;

import jakarta.validation.constraints.NotBlank;

public class GoogleLinkRequest {

	@NotBlank(message = "Google ID token is required")
	private String idToken;

	public GoogleLinkRequest() {
	}

	public String getIdToken() {
		return idToken;
	}

	public void setIdToken(String idToken) {
		this.idToken = idToken;
	}
}
