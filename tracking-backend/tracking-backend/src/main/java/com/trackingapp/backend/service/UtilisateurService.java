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
        if (utilisateurRepository.existsByEmail(email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Cet email est déjà utilisé."
            );
        }

        Utilisateur u = new Utilisateur(
                email,
                nom,
                passwordEncoder.encode(motDePasseClair),
                role
        );
        return utilisateurRepository.save(u);
    }

    public Utilisateur authentifier(String email, String motDePasseClair) {
        Utilisateur u = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Identifiants invalides."
                ));

        if (!u.actif) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Compte désactivé."
            );
        }

        if (!passwordEncoder.matches(motDePasseClair, u.motDePasse)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Identifiants invalides."
            );
        }

        u.dateDerniereConnexion = Instant.now();
        utilisateurRepository.save(u);
        return u;
    }

    public Utilisateur trouverParEmail(String email) {
        return utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Utilisateur introuvable."
                ));
    }

    public List<Utilisateur> listerTous() {
        return utilisateurRepository.findAll();
    }
}