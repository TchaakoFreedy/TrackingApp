package com.trackingapp.backend.service;

import com.trackingapp.backend.model.Utilisateur;
import com.trackingapp.backend.repository.UtilisateurRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
public class UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;

    public UtilisateurService(
            UtilisateurRepository utilisateurRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.utilisateurRepository = utilisateurRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Utilisateur creer(String email, String nom, String motDePasseClair, String role) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required.");
        }
        if (utilisateurRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This email is already used.");
        }
        if (motDePasseClair == null || motDePasseClair.length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Password must be at least 6 characters.");
        }

        Utilisateur u = new Utilisateur(
                email,
                nom,
                passwordEncoder.encode(motDePasseClair),
                role == null || role.isBlank() ? "OPERATEUR" : role
        );
        return utilisateurRepository.save(u);
    }

    public Utilisateur authentifier(String email, String motDePasseClair) {
        Utilisateur u = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Invalid credentials."
                ));

        if (!u.actif) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account disabled.");
        }
        if (!passwordEncoder.matches(motDePasseClair, u.motDePasse)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials.");
        }

        u.dateDerniereConnexion = Instant.now();
        utilisateurRepository.save(u);
        return u;
    }

    public Utilisateur trouverParEmail(String email) {
        return utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found."
                ));
    }

    public Utilisateur trouverParId(String id) {
        return utilisateurRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found."
                ));
    }

    public List<Utilisateur> listerTous() {
        return utilisateurRepository.findAll();
    }

    // =============================================================
    // PROFIL — mise à jour de son propre compte
    // =============================================================
    public Utilisateur mettreAJourProfil(
            String id,
            String nom,
            String email,
            String nouveauMotDePasse,
            String motDePasseActuel
    ) {
        Utilisateur u = trouverParId(id);

        // Changement d'email
        if (email != null && !email.isBlank() && !email.equals(u.email)) {
            if (utilisateurRepository.existsByEmail(email)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "This email is already used.");
            }
            u.email = email;
        }

        if (nom != null && !nom.isBlank()) {
            u.nom = nom;
        }

        // Changement de mot de passe (nécessite l'ancien)
        if (nouveauMotDePasse != null && !nouveauMotDePasse.isBlank()) {
            if (motDePasseActuel == null || motDePasseActuel.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Current password is required.");
            }
            if (!passwordEncoder.matches(motDePasseActuel, u.motDePasse)) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                        "Current password is incorrect.");
            }
            if (nouveauMotDePasse.length() < 6) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "New password must be at least 6 characters.");
            }
            u.motDePasse = passwordEncoder.encode(nouveauMotDePasse);
        }

        return utilisateurRepository.save(u);
    }

    // =============================================================
    // ADMIN — gestion des autres utilisateurs
    // =============================================================
    public Utilisateur changerRole(String id, String role) {
        Utilisateur u = trouverParId(id);
        if (role != null && !role.isBlank()) {
            u.role = role;
        }
        return utilisateurRepository.save(u);
    }

    public Utilisateur activerDesactiver(String id, boolean actif) {
        Utilisateur u = trouverParId(id);
        u.actif = actif;
        return utilisateurRepository.save(u);
    }

    public void supprimer(String id) {
        Utilisateur u = trouverParId(id);
        utilisateurRepository.delete(u);
    }
}