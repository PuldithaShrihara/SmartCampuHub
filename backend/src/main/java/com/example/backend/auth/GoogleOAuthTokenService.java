package com.example.backend.auth;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

@Service
public class GoogleOAuthTokenService {

	private final GoogleIdTokenVerifier verifier;

	public GoogleOAuthTokenService(@Value("${app.google.oauth.client-id:}") String clientId) {
		if (StringUtils.hasText(clientId)) {
			this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
					.setAudience(Collections.singletonList(clientId.trim()))
					.build();
		}
		else {
			this.verifier = null;
		}
	}

	public boolean isConfigured() {
		return verifier != null;
	}

	/**
	 * Verifies a Google Sign-In ID token and returns normalized user fields.
	 */
	public GoogleUserPayload verifyAndParse(String idTokenString) {
		if (idTokenString == null || idTokenString.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Google ID token is required");
		}
		if (verifier == null) {
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
					"Google sign-in is not configured on this server");
		}
		try {
			GoogleIdToken idToken = verifier.verify(idTokenString.trim());
			if (idToken == null) {
				throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google token");
			}
			var payload = idToken.getPayload();
			String email = payload.getEmail();
			if (email == null || email.isBlank()) {
				throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google token has no email");
			}
			if (Boolean.FALSE.equals(payload.getEmailVerified())) {
				throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Google email is not verified");
			}
			String sub = payload.getSubject();
			if (sub == null || sub.isBlank()) {
				throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google token has no subject");
			}
			String name = (String) payload.get("name");
			if (name == null || name.isBlank()) {
				name = email;
			}
			return new GoogleUserPayload(email.trim().toLowerCase(), sub.trim(), name.trim());
		}
		catch (GeneralSecurityException | IOException e) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Could not verify Google token");
		}
	}

	public record GoogleUserPayload(String email, String googleSub, String fullName) {
	}
}
