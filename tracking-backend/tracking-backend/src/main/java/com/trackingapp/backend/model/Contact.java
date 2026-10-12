package com.trackingapp.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "contacts")
public class Contact {

    @Id
    public String id;

    public String nom;
    public String email;
    public String telephone;
    public String reference;   // code de suivi optionnel
    public String message;

    public String statut = "NOUVEAU"; // NOUVEAU, EN_COURS, TRAITE, ARCHIVE

    public String reponseAdmin;
    public Instant dateCreation;
    public Instant dateTraitement;

    public Contact() {
    }
}