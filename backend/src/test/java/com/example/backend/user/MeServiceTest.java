package com.example.backend.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
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
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.auth.GoogleOAuthTokenService;
import com.example.backend.auth.GoogleOAuthTokenService.GoogleUserPayload;
import com.example.backend.booking.repository.BookingRepository;
import com.example.backend.common.service.FileStorageService;
import com.example.backend.incident.repository.IncidentRepository;
import com.example.backend.mail.EmailService;
import com.example.backend.user.dto.me.ChangePasswordRequest;
import com.example.backend.user.dto.me.MeProfileDto;
import com.example.backend.user.dto.me.UpdateProfileRequest;
import com.example.backend.user.dto.me.UserPreferencesDto;
import com.example.backend.user.entity.Role;
import com.example.backend.user.entity.User;
import com.example.backend.user.entity.UserPreferences;
import com.example.backend.user.repository.UserRepository;
import com.example.backend.user.service.MeService;

@ExtendWith(MockitoExtension.class)
class MeServiceTest {

	@Mock
	UserRepository userRepository;

	@Mock
	PasswordEncoder passwordEncoder;

	@Mock
	BookingRepository bookingRepository;

	@Mock
	IncidentRepository incidentRepository;

	@Mock
	EmailService emailService;

	@Mock
	GoogleOAuthTokenService googleOAuthTokenService;

	@Mock
	FileStorageService fileStorageService;

	@InjectMocks
	MeService meService;

	private User student;

	@BeforeEach
	void setup() {
		student = new User();
		student.setId("u-1");
		student.setEmail("stu@my.sliit.lk");
		student.setFullName("Stu Dent");
		student.setRole(Role.STUDENT);
		student.setVerified(true);
		student.setPasswordHash("hashed-current");
	}

	@Test
	void getProfile_returnsDtoSnapshot() {
		when(userRepository.findByEmail("stu@my.sliit.lk")).thenReturn(Optional.of(student));

		MeProfileDto dto = meService.getProfile("stu@my.sliit.lk");

		assertThat(dto.email()).isEqualTo("stu@my.sliit.lk");
		assertThat(dto.fullName()).isEqualTo("Stu Dent");
		assertThat(dto.role()).isEqualTo(Role.STUDENT);
		assertThat(dto.hasPassword()).isTrue();
		assertThat(dto.googleLinked()).isFalse();
		assertThat(dto.preferences()).isNotNull();
	}

	@Test
	void updateProfile_trimAndPersist() {
		when(userRepository.findByEmail("stu@my.sliit.lk")).thenReturn(Optional.of(student));
		when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

		UpdateProfileRequest req = new UpdateProfileRequest();
		req.setFullName("  New Name  ");
		MeProfileDto dto = meService.updateProfile("stu@my.sliit.lk", req);

		assertThat(dto.fullName()).isEqualTo("New Name");
		verify(userRepository).save(student);
	}

	@Test
	void updateProfile_nameTooShort_returns400() {
		when(userRepository.findByEmail("stu@my.sliit.lk")).thenReturn(Optional.of(student));

		UpdateProfileRequest req = new UpdateProfileRequest();
		req.setFullName("a");

		assertThatThrownBy(() -> meService.updateProfile("stu@my.sliit.lk", req))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
				.isEqualTo(HttpStatus.BAD_REQUEST);
		verify(userRepository, never()).save(any(User.class));
	}

	@Test
	void changePassword_correctCurrent_persistsNewHash() {
		when(userRepository.findByEmail("stu@my.sliit.lk")).thenReturn(Optional.of(student));
		when(passwordEncoder.matches("oldpass", "hashed-current")).thenReturn(true);
		when(passwordEncoder.matches("newpass99", "hashed-current")).thenReturn(false);
		when(passwordEncoder.encode("newpass99")).thenReturn("hashed-new");

		ChangePasswordRequest req = new ChangePasswordRequest();
		req.setCurrentPassword("oldpass");
		req.setNewPassword("newpass99");

		meService.changePassword("stu@my.sliit.lk", req);

		assertThat(student.getPasswordHash()).isEqualTo("hashed-new");
		verify(userRepository).save(student);
	}

	@Test
	void changePassword_wrongCurrent_returns401() {
		when(userRepository.findByEmail("stu@my.sliit.lk")).thenReturn(Optional.of(student));
		when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

		ChangePasswordRequest req = new ChangePasswordRequest();
		req.setCurrentPassword("wrong");
		req.setNewPassword("newpass99");

		assertThatThrownBy(() -> meService.changePassword("stu@my.sliit.lk", req))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
				.isEqualTo(HttpStatus.UNAUTHORIZED);
		verify(userRepository, never()).save(any(User.class));
	}

	@Test
	void updatePreferences_partialPatch_keepsOtherFields() {
		UserPreferences existing = new UserPreferences();
		existing.setEmailNotifications(true);
		existing.setNotifyBookings(true);
		existing.setTheme("LIGHT");
		student.setPreferences(existing);
		when(userRepository.findByEmail("stu@my.sliit.lk")).thenReturn(Optional.of(student));
		when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

		UserPreferencesDto patch = new UserPreferencesDto();
		patch.setTheme("DARK");
		patch.setBookingViewMode("GRID");

		MeProfileDto dto = meService.updatePreferences("stu@my.sliit.lk", patch);

		assertThat(dto.preferences().getTheme()).isEqualTo("DARK");
		assertThat(dto.preferences().getBookingViewMode()).isEqualTo("GRID");
		assertThat(dto.preferences().getEmailNotifications()).isTrue();
		assertThat(dto.preferences().getNotifyBookings()).isTrue();
	}

	@Test
	void updatePreferences_invalidTheme_returns400() {
		when(userRepository.findByEmail("stu@my.sliit.lk")).thenReturn(Optional.of(student));

		UserPreferencesDto patch = new UserPreferencesDto();
		patch.setTheme("PURPLE");

		assertThatThrownBy(() -> meService.updatePreferences("stu@my.sliit.lk", patch))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
				.isEqualTo(HttpStatus.BAD_REQUEST);
	}

	@Test
	void linkGoogle_emailMismatch_returns400() {
		when(userRepository.findByEmail("stu@my.sliit.lk")).thenReturn(Optional.of(student));
		when(googleOAuthTokenService.isConfigured()).thenReturn(true);
		when(googleOAuthTokenService.verifyAndParse("tok"))
				.thenReturn(new GoogleUserPayload("other@my.sliit.lk", "sub-1", "Other"));

		assertThatThrownBy(() -> meService.linkGoogle("stu@my.sliit.lk", "tok"))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
				.isEqualTo(HttpStatus.BAD_REQUEST);
	}

	@Test
	void linkGoogle_success_savesGoogleSub() {
		when(userRepository.findByEmail("stu@my.sliit.lk")).thenReturn(Optional.of(student));
		when(googleOAuthTokenService.isConfigured()).thenReturn(true);
		when(googleOAuthTokenService.verifyAndParse("tok"))
				.thenReturn(new GoogleUserPayload("stu@my.sliit.lk", "sub-1", "Stu Dent"));
		when(userRepository.findByGoogleSub("sub-1")).thenReturn(Optional.empty());
		when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

		MeProfileDto dto = meService.linkGoogle("stu@my.sliit.lk", "tok");

		assertThat(dto.googleLinked()).isTrue();
		assertThat(student.getGoogleSub()).isEqualTo("sub-1");
	}

	@Test
	void unlinkGoogle_withoutPassword_returns400() {
		student.setPasswordHash(null);
		student.setGoogleSub("sub-1");
		when(userRepository.findByEmail("stu@my.sliit.lk")).thenReturn(Optional.of(student));

		assertThatThrownBy(() -> meService.unlinkGoogle("stu@my.sliit.lk"))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
				.isEqualTo(HttpStatus.BAD_REQUEST);
	}

	@Test
	void unlinkGoogle_withPassword_clearsGoogleSub() {
		student.setGoogleSub("sub-1");
		when(userRepository.findByEmail("stu@my.sliit.lk")).thenReturn(Optional.of(student));
		when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

		MeProfileDto dto = meService.unlinkGoogle("stu@my.sliit.lk");

		assertThat(dto.googleLinked()).isFalse();
		assertThat(student.getGoogleSub()).isNull();
	}

	@Test
	void requestDeletion_setsFlag() {
		when(userRepository.findByEmail("stu@my.sliit.lk")).thenReturn(Optional.of(student));
		when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

		MeProfileDto dto = meService.requestDeletion("stu@my.sliit.lk");

		assertThat(dto.deletionRequested()).isTrue();
		assertThat(student.isDeletionRequested()).isTrue();
	}
}
