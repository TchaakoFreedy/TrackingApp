
        package com.trackingapp.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
                .csrf(AbstractHttpConfigurer::disable)

                // Activation de CORS
                .cors(Customizer.withDefaults())

                // Désactivation des mécanismes d'authentification par défaut
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)

                // API sans session HTTP
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                // Règles d'autorisation
                .authorizeHttpRequests(authorize -> authorize

                        // Autoriser les requêtes de pré-vérification CORS
                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        ).permitAll()

                        // Connexion publique
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/auth/login"
                        ).permitAll()

                        // Suivi public des colis
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/tracking/**"
                        ).permitAll()

                        // Formulaire de contact public
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/contact"
                        ).permitAll()

                        // Routes administrateur protégées
                        .requestMatchers(
                                "/api/admin/**"
                        ).hasRole("ADMIN")

                        // Toutes les autres routes nécessitent une authentification
                        .anyRequest().authenticated()
                )

                // Filtre JWT personnalisé
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        // Origines autorisées
        config.setAllowedOrigins(List.of(
                "https://starline-xi.vercel.app",
                "http://localhost:4200",
                "http://localhost:8080"
        ));

        // Méthodes HTTP autorisées
        config.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
        ));

        // En-têtes autorisés, dont Authorization
        config.setAllowedHeaders(List.of("*"));

        // Autoriser les requêtes avec des informations d'identification
        config.setAllowCredentials(true);

        // Appliquer CORS à toutes les routes
        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", config);

        return source;
    }
}
