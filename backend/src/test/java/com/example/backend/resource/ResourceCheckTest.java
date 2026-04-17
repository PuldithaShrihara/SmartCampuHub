package com.example.backend.resource;

import com.example.backend.resource.entity.Resource;
import com.example.backend.resource.repository.ResourceRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import java.util.List;

@SpringBootTest
@TestPropertySource(properties = "spring.mongodb.uri=mongodb+srv://janithcamitha_db_user:YIc2H4I5KpIXWHEp@cluster0.ptmjjxa.mongodb.net/smartcampus?retryWrites=true&w=majority")
class ResourceCheckTest {

    @Autowired
    private ResourceRepository resourceRepository;

    @Test
    void checkResources() {
        List<Resource> resources = resourceRepository.findAll();
        System.out.println("--- Cloud Resources ---");
        for (Resource r : resources) {
            System.out.println("DEBUG: Resource: " + r.getName()
                    + " | ID: " + r.getId()
                    + " | Windows: " + r.getAvailabilityWindows());
        }
        System.out.println("--- End of Cloud Check ---");
    }
}
