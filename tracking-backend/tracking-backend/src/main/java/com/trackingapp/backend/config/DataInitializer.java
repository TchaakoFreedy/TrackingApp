package com.trackingapp.backend.config;

import com.trackingapp.backend.model.Utilisateur;
import com.trackingapp.backend.repository.UtilisateurRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.default-email:admin@aurex.com}")
    private String adminEmail;

    @Value("${app.admin.default-password:Admin@2024!}")
    private String adminPassword;

    public DataInitializer(
            UtilisateurRepository utilisateurRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.utilisateurRepository = utilisateurRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (!utilisateurRepository.existsByEmail(adminEmail)) {
            Utilisateur admin = new Utilisateur(
                    adminEmail,
                    "Administrateur",
                    passwordEncoder.encode(adminPassword),
                    "ADMIN"
            );
            admin.dateCreation = Instant.now();
            utilisateurRepository.save(admin);

            System.out.println("=================================================");
            System.out.println(" ADMIN créé automatiquement :");
            System.out.println("   email    : " + adminEmail);
            System.out.println("   password : " + adminPassword);
            System.out.println(" ⚠️  Changez ce mot de passe en production !");
            System.out.println("=================================================");
        }
    }
}