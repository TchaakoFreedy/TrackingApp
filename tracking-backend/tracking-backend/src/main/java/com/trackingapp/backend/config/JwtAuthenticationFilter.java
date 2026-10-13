package com.trackingapp.backend.config;

import com.trackingapp.backend.model.Utilisateur;
import com.trackingapp.backend.repository.UtilisateurRepository;
import com.trackingapp.backend.service.JwtService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

// ⚠️ PLUS de @Component !
// Ce filtre est créé comme @Bean dans SecurityConfig
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UtilisateurRepository utilisateurRepository;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            UtilisateurRepository utilisateurRepository
    ) {
        this.jwtService = jwtService;
        this.utilisateurRepository = utilisateurRepository;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getRequestURI();
        String header = request.getHeader("Authorization");

        if (header == null || !header.startsWith("Bearer ")) {
            System.out.println("[JWT] ❌ Pas de token pour " + path);
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);

        try {
            Claims claims = jwtService.extraireClaims(token);
            String email = claims.getSubject();
            String roleClaim = (String) claims.get("role");

            System.out.println("[JWT] ✅ Token décodé pour " + path
                    + " | email=" + email
                    + " | role_claim=" + roleClaim);

            if (email != null
                    && SecurityContextHolder.getContext().getAuthentication() == null) {

                Utilisateur u = utilisateurRepository.findByEmail(email).orElse(null);

                if (u == null) {
                    System.out.println("[JWT] ❌ Utilisateur introuvable : " + email);
                } else if (!u.actif) {
                    System.out.println("[JWT] ❌ Compte désactivé : " + email);
                } else {
                    var authorities = List.of(
                            new SimpleGrantedAuthority("ROLE_" + u.role)
                    );
                    var auth = new UsernamePasswordAuthenticationToken(
                            u.email, null, authorities
                    );
                    auth.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );
                    SecurityContextHolder.getContext().setAuthentication(auth);

                    System.out.println("[JWT] 🔐 Auth SET : " + email
                            + " | ROLE_" + u.role);
                }
            }
        } catch (Exception e) {
            System.out.println("[JWT] 💥 Exception : "
                    + e.getClass().getSimpleName()
                    + " → " + e.getMessage());
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}