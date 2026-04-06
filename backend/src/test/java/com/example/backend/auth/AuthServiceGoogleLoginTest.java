package com.example.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.auth.GoogleOAuthTokenService.GoogleUserPayload;
import com.example.backend.auth.dto.AuthResponse;
import com.example.backend.auth.dto.StudentGoogleLoginRequest;
import com.example.backend.auth.service.AuthService;
import com.example.backend.mail.EmailService;
import com.example.backend.security.JwtService;
import com.example.backend.user.entity.Role;
import com.example.backend.user.entity.User;
import com.example.backend.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class AuthServiceGoogleLoginTest {

	@Mock
	UserRepository userRepository;

	@Mock
	PasswordEncoder passwordEncoder;

	@Mock
	JwtService jwtService;

	@Mock
	EmailService emailService;

	@Mock
	GoogleOAuthTokenService googleOAuthTokenService;

	@InjectMocks
	AuthService authService;

	@BeforeEach
	void setup() {
		ReflectionTestUtils.setField(authService, "allowedGoogleEmailDomains", "my.sliit.lk");
	}

	@Test
	void loginStudentWithGoogle_notConfigured_returns503() {
		when(googleOAuthTokenService.isConfigured()).thenReturn(false);
		assertThatThrownBy(() -> authService.loginStudentWithGoogle(new StudentGoogleLoginRequest("tok")))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
				.isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
	}

	@Test
	void loginStudentWithGoogle_createsStudent() {
		when(googleOAuthTokenService.isConfigured()).thenReturn(true);
		when(googleOAuthTokenService.verifyAndParse("tok"))
				.thenReturn(new GoogleUserPayload("stu@my.sliit.lk", "google-sub-1", "Stu Dent"));
		when(userRepository.findByEmail("stu@my.sliit.lk")).thenReturn(Optional.empty());
		when(userRepository.findByGoogleSub("google-sub-1")).thenReturn(Optional.empty());
		when(passwordEncoder.encode(anyString())).thenReturn("opaque-hash");
		when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
		when(jwtService.generateToken(isNull(), eq("stu@my.sliit.lk"), eq(Role.STUDENT))).thenReturn("jwt-token");

		AuthResponse r = authService.loginStudentWithGoogle(new StudentGoogleLoginRequest("tok"));

		assertThat(r.accessToken()).isEqualTo("jwt-token");
		assertThat(r.email()).isEqualTo("stu@my.sliit.lk");
		verify(userRepository).save(any(User.class));
	}

	@Test
	void loginStudentWithGoogle_nonStudentEmail_returns403() {
		when(googleOAuthTokenService.isConfigured()).thenReturn(true);
		when(googleOAuthTokenService.verifyAndParse("tok"))
				.thenReturn(new GoogleUserPayload("admin@my.sliit.lk", "sub", "A"));
		User admin = new User();
		admin.setEmail("admin@my.sliit.lk");
		admin.setRole(Role.ADMIN);
		when(userRepository.findByEmail("admin@my.sliit.lk")).thenReturn(Optional.of(admin));

		assertThatThrownBy(() -> authService.loginStudentWithGoogle(new StudentGoogleLoginRequest("tok")))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
				.isEqualTo(HttpStatus.FORBIDDEN);
	}

	@Test
	void loginStudentWithGoogle_domainNotAllowed_returns403() {
		ReflectionTestUtils.setField(authService, "allowedGoogleEmailDomains", "myschool.edu");
		when(googleOAuthTokenService.isConfigured()).thenReturn(true);
		when(googleOAuthTokenService.verifyAndParse("tok"))
				.thenReturn(new GoogleUserPayload("a@gmail.com", "sub", "A"));

		assertThatThrownBy(() -> authService.loginStudentWithGoogle(new StudentGoogleLoginRequest("tok")))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
				.isEqualTo(HttpStatus.FORBIDDEN);
	}

	@Test
	void loginStudentWithGoogle_blankAllowlist_defaultsToSliitAndRejectsGmail() {
		ReflectionTestUtils.setField(authService, "allowedGoogleEmailDomains", "");
		when(googleOAuthTokenService.isConfigured()).thenReturn(true);
		when(googleOAuthTokenService.verifyAndParse("tok"))
				.thenReturn(new GoogleUserPayload("user@gmail.com", "sub", "U"));

		assertThatThrownBy(() -> authService.loginStudentWithGoogle(new StudentGoogleLoginRequest("tok")))
				.isInstanceOf(ResponseStatusException.class)
				.satisfies(ex -> {
					ResponseStatusException r = (ResponseStatusException) ex;
					assertThat(r.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
					assertThat(r.getReason()).containsIgnoringCase("gmail");
				});
	}
}
