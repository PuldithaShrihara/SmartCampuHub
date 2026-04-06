package com.example.backend.user.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.backend.user.entity.Role;
import com.example.backend.user.entity.User;

public interface UserRepository extends MongoRepository<User, String> {

	Optional<User> findByEmail(String email);

	Optional<User> findByGoogleSub(String googleSub);

	boolean existsByEmailIgnoreCase(String email);

	List<User> findByRole(Role role);

	List<User> findByRoleIn(List<Role> roles);

	List<User> findAllByOrderByCreatedAtDesc();

}
