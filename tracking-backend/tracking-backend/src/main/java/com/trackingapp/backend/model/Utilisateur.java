package com.trackingapp.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "utilisateurs")
public class Utilisateur {

    @Id
    public String id;

    @Indexed(unique = true)
    public String email;

    public String nom;
    public String motDePasse;   // hashé BCrypt

    public String role = "ADMIN"; // ADMIN, OPERATEUR

    public boolean actif = true;

    public Instant dateCreation;
    public Instant dateDerniereConnexion;

    public Utilisateur() {
    }

    public Utilisateur(String email, String nom, String motDePasse, String role) {
        this.email = email;
        this.nom = nom;
        this.motDePasse = motDePasse;
        this.role = role;
        this.actif = true;
        this.dateCreation = Instant.now();
    }
}