package com.example.backend.user;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserRepository extends MongoRepository<User, String> {

	Optional<User> findByEmail(String email);

	boolean existsByEmailIgnoreCase(String email);

	List<User> findByRole(Role role);

	List<User> findAllByOrderByCreatedAtDesc();

}
