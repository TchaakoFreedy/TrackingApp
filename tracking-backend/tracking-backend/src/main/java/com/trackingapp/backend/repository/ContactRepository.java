package com.trackingapp.backend.repository;

import com.trackingapp.backend.model.Contact;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ContactRepository extends MongoRepository<Contact, String> {

    List<Contact> findAllByOrderByDateCreationDesc();

    List<Contact> findByStatutOrderByDateCreationDesc(String statut);

    long countByStatut(String statut);
}