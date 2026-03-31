package com.example.backend.user.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.backend.auth.dto.CreateStaffUserRequest;
import com.example.backend.auth.dto.UserSummaryDto;
import com.example.backend.auth.service.UserManagementService;

@Service
public class UserService {

	private final UserManagementService userManagementService;

	public UserService(UserManagementService userManagementService) {
		this.userManagementService = userManagementService;
	}

	public UserSummaryDto createTechnicianByAdmin(CreateStaffUserRequest request) {
		return userManagementService.createTechnicianByAdmin(request);
	}

	public List<UserSummaryDto> listTechnicians() {
		return userManagementService.listTechnicians();
	}

}
