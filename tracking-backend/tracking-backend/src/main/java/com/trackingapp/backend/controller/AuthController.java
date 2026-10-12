package com.trackingapp.backend.controller;

import com.trackingapp.backend.model.Utilisateur;
import com.trackingapp.backend.service.JwtService;
import com.trackingapp.backend.service.UtilisateurService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UtilisateurService utilisateurService;
    private final JwtService jwtService;

    public AuthController(
            UtilisateurService utilisateurService,
            JwtService jwtService
    ) {
        this.utilisateurService = utilisateurService;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest req) {
        if (req == null || req.email() == null || req.password() == null) {
            return ResponseEntity.badRequest().build();
        }

        Utilisateur u = utilisateurService.authentifier(req.email(), req.password());

        String token = jwtService.genererToken(u.email, u.role, u.id);

        return ResponseEntity.ok(new LoginResponse(
                token,
                u.email,
                u.nom,
                u.role,
                8 * 3600 // secondes
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<Utilisateur> me(@RequestHeader("Authorization") String header) {
        if (header == null || !header.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }
        String token = header.substring(7);
        String email = jwtService.extraireEmail(token);
        return ResponseEntity.ok(utilisateurService.trouverParEmail(email));
    }

    public record LoginRequest(String email, String password) {
    }

    public record LoginResponse(
            String token,
            String email,
            String nom,
            String role,
            long expiresInSeconds
    ) {
    }
}