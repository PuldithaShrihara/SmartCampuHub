package com.example.backend.resource;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;

import java.util.ArrayList;
import java.util.List;

public class CloudResourceChecker {
    public static void main(String[] args) {
        String uri = "mongodb+srv://janithcamitha_db_user:YIc2H4I5KpIXWHEp@cluster0.ptmjjxa.mongodb.net/smartcampus?retryWrites=true&w=majority";
        try (MongoClient mongoClient = MongoClients.create(uri)) {
            MongoDatabase database = mongoClient.getDatabase("smartcampus");
            MongoCollection<Document> collection = database.getCollection("resources");

            System.out.println("--- Cloud Resources ---");
            for (Document doc : collection.find()) {
                System.out.println("DEBUG: Resource: " + doc.get("name")
                        + " | ID: " + doc.get("_id")
                        + " | Windows: " + doc.get("availabilityWindows"));
            }
            System.out.println("--- End of Cloud Check ---");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
