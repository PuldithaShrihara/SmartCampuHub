package com.example.backend.config;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.backend.user.Role;
import com.example.backend.user.User;
import com.example.backend.user.UserRepository;

/**
 * Demo accounts (login may use short usernames; frontend maps them to these emails).
 * SUPERADMIN uses {@code app.superadmin.email} (often {@code admin}) — staff admin is
 * {@code admin@smartcampus.local} to avoid unique-email collision.
 */
@Component
@Order(2)
public class DemoUsersBootstrap implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(DemoUsersBootstrap.class);

	static final String DOMAIN = "@smartcampus.local";

	private final UserRepository userRepository;

	private final PasswordEncoder passwordEncoder;

	public DemoUsersBootstrap(UserRepository userRepository, PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
	}

	@Override
	public void run(ApplicationArguments args) {
		seedIfAbsent("student1" + DOMAIN, "Student@123", Role.STUDENT, "Demo Student");
		seedIfAbsent("admin" + DOMAIN, "Admin@123", Role.ADMIN, "Demo Admin");
		seedIfAbsent("tech1" + DOMAIN, "Tech@123", Role.TECHNICIAN, "Demo Technician");
	}

	private void seedIfAbsent(String email, String plainPassword, Role role, String fullName) {
		String key = email.trim().toLowerCase();
		if (userRepository.findByEmail(key).isPresent()) {
			return;
		}
		User user = new User();
		user.setEmail(key);
		user.setPasswordHash(passwordEncoder.encode(plainPassword));
		user.setFullName(fullName);
		user.setRole(role);
		user.setCreatedAt(Instant.now());
		userRepository.save(user);
		log.info("Seeded demo {} user: {}", role, key);
	}
}
