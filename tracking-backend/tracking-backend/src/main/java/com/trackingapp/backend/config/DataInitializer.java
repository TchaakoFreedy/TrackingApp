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

        System.out.println("=================================================");
        System.out.println(" DataInitializer — vérification du compte admin");
        System.out.println("   email ciblé : " + adminEmail);
        System.out.println("=================================================");

        // =============================================================
        // Cas 1 : le compte n'existe pas → on le crée
        // =============================================================
        if (!utilisateurRepository.existsByEmail(adminEmail)) {

            Utilisateur admin = new Utilisateur(
                    adminEmail,
                    "Administrateur",
                    passwordEncoder.encode(adminPassword),
                    "ADMIN"          // ✅ rôle en MAJUSCULES
            );
            admin.actif = true;
            admin.dateCreation = Instant.now();
            utilisateurRepository.save(admin);

            System.out.println(" ✅ ADMIN créé automatiquement :");
            System.out.println("     email    : " + adminEmail);
            System.out.println("     password : " + adminPassword);
            System.out.println("     role     : ADMIN");
            System.out.println("     actif    : true");
            System.out.println(" ⚠️  Changez ce mot de passe en production !");
            System.out.println("=================================================");
            return;
        }

        // =============================================================
        // Cas 2 : le compte existe → on VÉRIFIE et on CORRIGE le rôle
        // =============================================================
        Utilisateur existing = utilisateurRepository
                .findByEmail(adminEmail)
                .orElse(null);

        if (existing == null) return;   // sécurité (ne devrait pas arriver)

        boolean modified = false;

        // Corriger le rôle si nécessaire
        if (!"ADMIN".equals(existing.role)) {
            System.out.println(" ⚠️  Rôle incorrect détecté : '" + existing.role
                    + "' → correction vers 'ADMIN'");
            existing.role = "ADMIN";
            modified = true;
        }

        // S'assurer que le compte est actif
        if (!existing.actif) {
            System.out.println(" ⚠️  Compte désactivé → réactivation");
            existing.actif = true;
            modified = true;
        }

        if (modified) {
            utilisateurRepository.save(existing);
            System.out.println(" ✅ Compte admin corrigé en base.");
            System.out.println("     → Vous DEVEZ vous reconnecter pour régénérer le token.");
        } else {
            System.out.println(" ✅ Compte admin OK (role=ADMIN, actif=true).");
        }

        System.out.println("=================================================");
    }
}