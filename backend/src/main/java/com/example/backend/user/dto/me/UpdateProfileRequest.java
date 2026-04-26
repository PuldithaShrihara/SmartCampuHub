package com.example.backend.user.dto.me;

import jakarta.validation.constraints.Size;

public class UpdateProfileRequest {

	@Size(min = 2, max = 60, message = "Full name must be between 2 and 60 characters")
	private String fullName;

	@Size(max = 500, message = "Avatar URL is too long")
	private String avatarUrl;

	public UpdateProfileRequest() {
	}

	public String getFullName() {
		return fullName;
	}

	public void setFullName(String fullName) {
		this.fullName = fullName;
	}

	public String getAvatarUrl() {
		return avatarUrl;
	}

	public void setAvatarUrl(String avatarUrl) {
		this.avatarUrl = avatarUrl;
	}
}
