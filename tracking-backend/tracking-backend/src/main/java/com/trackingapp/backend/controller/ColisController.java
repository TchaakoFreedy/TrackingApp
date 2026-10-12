package com.trackingapp.backend.controller;

import com.trackingapp.backend.model.Colis;
import com.trackingapp.backend.model.StatutColis;
import com.trackingapp.backend.service.ColisService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping
public class ColisController {

    private final ColisService colisService;

    public ColisController(ColisService colisService) {
        this.colisService = colisService;
    }

    // Créer un colis : réservé à l'administration
    @PostMapping("/api/admin/colis")
    public ResponseEntity<Colis> creer(@RequestBody Colis colis) {
        Colis nouveauColis = colisService.creer(colis);
        return ResponseEntity.status(HttpStatus.CREATED).body(nouveauColis);
    }

    // Liste complète des colis
    @GetMapping("/api/admin/colis")
    public List<Colis> listerTous() {
        return colisService.listerTous();
    }

    // Détails complets d'un colis pour l'administration
    @GetMapping("/api/admin/colis/{id}")
    public Colis trouverParId(@PathVariable String id) {
        return colisService.trouverParId(id);
    }

    // Mise à jour du statut, de la localisation et de l'historique
    @PatchMapping("/api/admin/colis/{id}/statut")
    public Colis mettreAJourStatut(
            @PathVariable String id,
            @RequestBody MiseAJourStatutRequest demande
    ) {
        return colisService.mettreAJourStatut(
                id,
                demande.statut(),
                demande.description(),
                demande.villeActuelle(),
                demande.lieuActuel(),
                demande.latitude(),
                demande.longitude(),
                demande.misAJourPar(),
                demande.remarques()
        );
    }

    // Suppression administrative
    @DeleteMapping("/api/admin/colis/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable String id) {
        colisService.supprimer(id);
        return ResponseEntity.noContent().build();
    }

    /*
     * Suivi public.
     * Les téléphones, e-mails et adresses privées ne sont pas exposés ici.
     * L'administration peut consulter la fiche complète via /api/admin/colis/{id}.
     */
    @GetMapping("/api/tracking/{code}")
    public TrackingResponse suivre(@PathVariable String code) {
        Colis colis = colisService.suivreParCode(code);

        return new TrackingResponse(
                colis.codeSuivi,
                colis.statut,
                colis.nomExpediteur,
                colis.nomDestinataire,
                colis.villeOrigine,
                colis.paysOrigine,
                colis.villeDestination,
                colis.paysDestination,
                colis.transporteur,
                colis.typeExpedition,
                colis.modeTransport,
                colis.referenceTransporteur,
                colis.description,
                colis.produit,
                colis.quantite,
                colis.poids,
                colis.poidsReelTotal,
                colis.poidsVolumetriqueTotal,
                colis.volumeTotal,
                colis.modePaiement,
                colis.fraisTransport,
                colis.devise,
                colis.dateLivraisonPrevue,
                colis.dateRamassage,
                colis.heureRamassage,
                colis.dateDepart,
                colis.heureDepart,
                colis.dateLivraisonEffective,
                colis.heureLivraisonEffective,
                colis.villeActuelle,
                colis.lieuActuel,
                colis.latitude,
                colis.longitude,
                colis.commentaires,
                colis.packages,
                colis.historique,
                colis.dateCreation,
                colis.dateModification
        );
    }

    public record MiseAJourStatutRequest(
            StatutColis statut,
            String description,
            String villeActuelle,
            String lieuActuel,
            Double latitude,
            Double longitude,
            String misAJourPar,
            String remarques
    ) {
    }

    public record TrackingResponse(
            String codeSuivi,
            StatutColis statut,
            String nomExpediteur,
            String nomDestinataire,
            String villeOrigine,
            String paysOrigine,
            String villeDestination,
            String paysDestination,
            String transporteur,
            String typeExpedition,
            String modeTransport,
            String referenceTransporteur,
            String description,
            String produit,
            Integer quantite,
            Double poids,
            Double poidsReelTotal,
            Double poidsVolumetriqueTotal,
            Double volumeTotal,
            String modePaiement,
            BigDecimal fraisTransport,
            String devise,
            LocalDate dateLivraisonPrevue,
            LocalDate dateRamassage,
            LocalTime heureRamassage,
            LocalDate dateDepart,
            LocalTime heureDepart,
            LocalDate dateLivraisonEffective,
            LocalTime heureLivraisonEffective,
            String villeActuelle,
            String lieuActuel,
            Double latitude,
            Double longitude,
            String commentaires,
            List<Colis.PieceColis> packages,
            List<Colis.EtapeSuivi> historique,
            java.time.Instant dateCreation,
            java.time.Instant dateModification
    ) {
    }
}