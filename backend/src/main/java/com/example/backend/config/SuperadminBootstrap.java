package com.example.backend.config;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.backend.user.entity.Role;
import com.example.backend.user.entity.User;
import com.example.backend.user.repository.UserRepository;

@Component
@Order(1)
public class SuperadminBootstrap implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(SuperadminBootstrap.class);

	private final UserRepository userRepository;

	private final PasswordEncoder passwordEncoder;

	@Value("${app.superadmin.email:superadmin@smartcampus.local}")
	private String superadminEmail;

	@Value("${app.superadmin.password:ChangeMe_SuperAdmin_123!}")
	private String superadminPassword;

	@Value("${app.superadmin.full-name:System Superadmin}")
	private String superadminFullName;

	public SuperadminBootstrap(UserRepository userRepository, PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
	}

	@Override
	public void run(ApplicationArguments args) {
		String email = superadminEmail.trim().toLowerCase();
		if (userRepository.findByEmail(email).isPresent()) {
			return;
		}
		User user = new User();
		user.setEmail(email);
		user.setPasswordHash(passwordEncoder.encode(superadminPassword));
		user.setFullName(superadminFullName.trim());
		user.setRole(Role.SUPERADMIN);
		user.setCreatedAt(Instant.now());
		userRepository.save(user);
		log.warn("Seeded SUPERADMIN user: {} (change app.superadmin.password immediately in production)", email);
	}

}
