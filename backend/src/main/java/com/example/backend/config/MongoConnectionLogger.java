package com.example.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class MongoConnectionLogger {
	private static final Logger log = LoggerFactory.getLogger(MongoConnectionLogger.class);

	@Value("${spring.data.mongodb.uri:}")
	private String springDataMongoUri;

	@Value("${spring.mongodb.uri:}")
	private String springMongoUri;

	@EventListener(ApplicationReadyEvent.class)
	public void logMongoConnection() {
		String effective = !springMongoUri.isBlank() ? springMongoUri : springDataMongoUri;
		String redacted = effective.replaceAll("://([^:]+):([^@]+)@", "://$1:****@");
		log.info("MongoDB URI property resolved to: {}", redacted);
	}
}
