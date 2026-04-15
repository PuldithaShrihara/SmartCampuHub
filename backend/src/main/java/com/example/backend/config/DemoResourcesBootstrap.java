package com.example.backend.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.example.backend.resource.repository.ResourceRepository;

@Component
@Order(1)
public class DemoResourcesBootstrap implements ApplicationRunner {

    public DemoResourcesBootstrap(ResourceRepository resourceRepository) {}

    @Override
    public void run(ApplicationArguments args) {}
}
