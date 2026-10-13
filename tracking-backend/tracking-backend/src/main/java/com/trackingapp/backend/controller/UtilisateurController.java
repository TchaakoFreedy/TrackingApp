package com.trackingapp.backend.controller;

import com.trackingapp.backend.model.Utilisateur;
import com.trackingapp.backend.service.UtilisateurService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
public class UtilisateurController {

    private final UtilisateurService utilisateurService;

    public UtilisateurController(UtilisateurService utilisateurService) {
        this.utilisateurService = utilisateurService;
    }

    // =============================================================
    // PROFIL — Utilisateur connecté
    // =============================================================

    // Récupérer son propre profil
    @GetMapping("/api/users/me")
    public Utilisateur monProfil(Authentication authentication) {
        return utilisateurService.trouverParEmail(authentication.getName());
    }

    // Mettre à jour son propre profil (nom, email, mot de passe)
    @PutMapping("/api/users/me")
    public Utilisateur mettreAJourMonProfil(
            Authentication authentication,
            @RequestBody MiseAJourProfilRequest demande
    ) {
        Utilisateur u = utilisateurService.trouverParEmail(authentication.getName());

        return utilisateurService.mettreAJourProfil(
                u.id,
                demande.nom(),
                demande.email(),
                demande.nouveauMotDePasse(),
                demande.motDePasseActuel()
        );
    }

    // =============================================================
    // ADMINISTRATION — Gestion des utilisateurs
    // =============================================================

    // Liste complète des utilisateurs
    @GetMapping("/api/users")
    public List<Utilisateur> listerTous() {
        return utilisateurService.listerTous();
    }

    // Détails d'un utilisateur
    @GetMapping("/api/users/{id}")
    public Utilisateur trouverParId(@PathVariable String id) {
        return utilisateurService.trouverParId(id);
    }

    // Créer un nouvel utilisateur
    @PostMapping("/api/users")
    public ResponseEntity<Utilisateur> creer(
            @RequestBody CreationUtilisateurRequest demande
    ) {
        Utilisateur nouveau = utilisateurService.creer(
                demande.email(),
                demande.nom(),
                demande.motDePasse(),
                demande.role()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(nouveau);
    }

    // Changer le rôle d'un utilisateur
    @PatchMapping("/api/users/{id}/role")
    public Utilisateur changerRole(
            @PathVariable String id,
            @RequestBody ChangementRoleRequest demande
    ) {
        return utilisateurService.changerRole(id, demande.role());
    }

    // Activer / désactiver un utilisateur
    @PatchMapping("/api/users/{id}/actif")
    public Utilisateur activerDesactiver(
            @PathVariable String id,
            @RequestBody ActivationRequest demande
    ) {
        return utilisateurService.activerDesactiver(id, demande.actif());
    }

    // Suppression administrative
    @DeleteMapping("/api/users/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable String id) {
        utilisateurService.supprimer(id);
        return ResponseEntity.noContent().build();
    }

    // =============================================================
    // DTO (records) — Mêmes conventions que ColisController
    // =============================================================

    public record MiseAJourProfilRequest(
            String nom,
            String email,
            String nouveauMotDePasse,
            String motDePasseActuel
    ) {
    }

    public record CreationUtilisateurRequest(
            String email,
            String nom,
            String motDePasse,
            String role
    ) {
    }

    public record ChangementRoleRequest(
            String role
    ) {
    }

    public record ActivationRequest(
            boolean actif
    ) {
    }
}