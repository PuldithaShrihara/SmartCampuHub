package com.example.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.example.backend.resource.entity.Resource;
import com.example.backend.resource.repository.ResourceRepository;

@Component
@Order(1)
public class DemoResourcesBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoResourcesBootstrap.class);

    private final ResourceRepository resourceRepository;

    public DemoResourcesBootstrap(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        seedIfAbsent("res-lha", "Lecture Hall A", "Academic Block A", 120);
        seedIfAbsent("res-cl2", "Computer Lab 2", "Engineering Wing", 45);
        seedIfAbsent("lcc A104", "Lecture Complex Center A104", "Main Campus", 60);
    }

    private void seedIfAbsent(String id, String name, String location, Integer capacity) {
        if (resourceRepository.existsById(id)) {
            return;
        }
        Resource r = new Resource();
        r.setId(id);
        r.setName(name);
        r.setLocation(location);
        r.setCapacity(capacity);
        resourceRepository.save(r);
        log.info("Seeded demo resource: {} ({})", name, id);
    }
}
