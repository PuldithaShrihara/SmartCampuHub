package com.example.backend.resource.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "resources")
public class Resource {

	@Id
	private String id;
	private String name;
	private ResourceType type;
	private Integer capacity;
	private String location;
	private java.util.List<String> availabilityWindows;
	private ResourceStatus status;
	private String photoUrl;

	private String name;

	private String location;

	private Integer capacity;

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public ResourceType getType() {
		return type;
	}

	public void setType(ResourceType type) {
		this.type = type;
	}

	public Integer getCapacity() {
		return capacity;
	}

	public void setCapacity(Integer capacity) {
		this.capacity = capacity;
	}

	public String getLocation() {
		return location;
	}

	public void setLocation(String location) {
		this.location = location;
	}

	public java.util.List<String> getAvailabilityWindows() {
		return availabilityWindows;
	}

	public void setAvailabilityWindows(java.util.List<String> availabilityWindows) {
		this.availabilityWindows = availabilityWindows;
	}

	public ResourceStatus getStatus() {
		return status;
	}

	public void setStatus(ResourceStatus status) {
		this.status = status;
	}

	public String getPhotoUrl() {
		return photoUrl;
	}

	public void setPhotoUrl(String photoUrl) {
		this.photoUrl = photoUrl;
	}

}
