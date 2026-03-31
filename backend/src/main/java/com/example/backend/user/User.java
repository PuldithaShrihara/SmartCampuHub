package com.example.backend.user;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "users")
public class User {

	@Id
	private String id;

	@Indexed(unique = true)
	private String email;

	private String passwordHash;

	private String fullName;

	private Role role;

	private Instant createdAt;

	/**
	 * When {@code false}, student self-registration must verify email before login.
	 * {@code null} means legacy/other accounts (treated as verified for login checks when not {@code false}).
	 */
	private Boolean verified;

	/**
	 * Single-use verification OTP until verified or expired.
	 */
	private String verificationOtp;

	private Instant verificationOtpExpiresAt;

	/**
	 * Single-use OTP for forgot-password reset flow.
	 */
	private String passwordResetOtp;

	private Instant passwordResetOtpExpiresAt;

	public User() {
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	public void setPasswordHash(String passwordHash) {
		this.passwordHash = passwordHash;
	}

	public String getFullName() {
		return fullName;
	}

	public void setFullName(String fullName) {
		this.fullName = fullName;
	}

	public Role getRole() {
		return role;
	}

	public void setRole(Role role) {
		this.role = role;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}

	public Boolean getVerified() {
		return verified;
	}

	public void setVerified(Boolean verified) {
		this.verified = verified;
	}

	public String getVerificationOtp() {
		return verificationOtp;
	}

	public void setVerificationOtp(String verificationOtp) {
		this.verificationOtp = verificationOtp;
	}

	public Instant getVerificationOtpExpiresAt() {
		return verificationOtpExpiresAt;
	}

	public void setVerificationOtpExpiresAt(Instant verificationOtpExpiresAt) {
		this.verificationOtpExpiresAt = verificationOtpExpiresAt;
	}

	public String getPasswordResetOtp() {
		return passwordResetOtp;
	}

	public void setPasswordResetOtp(String passwordResetOtp) {
		this.passwordResetOtp = passwordResetOtp;
	}

	public Instant getPasswordResetOtpExpiresAt() {
		return passwordResetOtpExpiresAt;
	}

	public void setPasswordResetOtpExpiresAt(Instant passwordResetOtpExpiresAt) {
		this.passwordResetOtpExpiresAt = passwordResetOtpExpiresAt;
	}

}
