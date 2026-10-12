package com.trackingapp.backend.service;

import com.trackingapp.backend.model.Colis;
import com.trackingapp.backend.model.Colis.EtapeSuivi;
import com.trackingapp.backend.model.Colis.PieceColis;
import com.trackingapp.backend.model.StatutColis;
import com.trackingapp.backend.repository.ColisRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Locale;
import java.util.UUID;

@Service
public class ColisService {

    private final ColisRepository colisRepository;

    public ColisService(ColisRepository colisRepository) {
        this.colisRepository = colisRepository;
    }

    // =============================================================
    // CREATE
    // =============================================================
    public Colis creer(Colis colis) {
        if (colis == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Shipment data is required."
            );
        }

        exigerTexte(colis.nomExpediteur, "Sender name is required.");
        exigerTexte(colis.nomDestinataire, "Recipient name is required.");

        if (colis.adresseOrigine == null || colis.adresseOrigine.isBlank()) {
            exigerTexte(colis.villeOrigine, "Origin city is required.");
        }

        if (colis.adresseDestination == null || colis.adresseDestination.isBlank()) {
            exigerTexte(colis.villeDestination, "Destination city is required.");
        }

        if (colis.packages == null) {
            colis.packages = new ArrayList<>();
        }

        if (colis.historique == null) {
            colis.historique = new ArrayList<>();
        }

        verifierPieces(colis);
        calculerTotaux(colis);

        if (colis.poids == null) {
            colis.poids = colis.poidsReelTotal;
        }

        if (colis.poids == null || colis.poids <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Weight must be positive or provided by package details."
            );
        }

        if (colis.quantite == null) {
            colis.quantite = colis.packages.stream()
                    .mapToInt(piece -> piece.quantite == null ? 1 : piece.quantite)
                    .sum();

            if (colis.quantite == 0) {
                colis.quantite = 1;
            }
        }

        if (colis.quantite <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Quantity must be positive."
            );
        }

        if (colis.codeSuivi == null || colis.codeSuivi.isBlank()) {
            colis.codeSuivi = genererCodeSuivi();
        } else {
            colis.codeSuivi = colis.codeSuivi.trim().toUpperCase(Locale.ROOT);

            if (colisRepository.existsByCodeSuivi(colis.codeSuivi)) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT, "This tracking code already exists."
                );
            }
        }

        if (colis.statut == null) {
            colis.statut = StatutColis.PENDING;
        }

        if (colis.villeActuelle == null || colis.villeActuelle.isBlank()) {
            colis.villeActuelle = colis.villeOrigine;
        }

        if (colis.lieuActuel == null || colis.lieuActuel.isBlank()) {
            colis.lieuActuel = colis.adresseOrigine;
        }

        Instant maintenant = Instant.now();

        colis.dateCreation = maintenant;
        colis.dateModification = maintenant;

        if (colis.historique.isEmpty()) {
            ajouterEtape(
                    colis,
                    colis.statut,
                    "Shipment registered in the system",
                    colis.villeActuelle,
                    colis.lieuActuel,
                    colis.latitude,
                    colis.longitude,
                    valeurParDefaut(colis.creePar, "admin"),
                    colis.commentaires,
                    maintenant
            );
        }

        return colisRepository.save(colis);
    }

    // =============================================================
    // READ
    // =============================================================
    public java.util.List<Colis> listerTous() {
        return colisRepository.findAll();
    }

    public Colis trouverParId(String id) {
        return colisRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Shipment not found."
                ));
    }

    public Colis suivreParCode(String code) {
        if (code == null || code.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Tracking code is required."
            );
        }

        return colisRepository.findByCodeSuivi(
                        code.trim().toUpperCase(Locale.ROOT)
                )
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No shipment matches this tracking code."
                ));
    }

    // =============================================================
    // UPDATE STATUS
    // =============================================================
    public Colis mettreAJourStatut(
            String id,
            StatutColis nouveauStatut,
            String description,
            String ville,
            String lieu,
            Double latitude,
            Double longitude,
            String misAJourPar,
            String remarques
    ) {
        if (nouveauStatut == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "The new status is required."
            );
        }

        Colis colis = trouverParId(id);
        Instant maintenant = Instant.now();

        colis.statut = nouveauStatut;
        colis.dateModification = maintenant;

        if (ville != null && !ville.isBlank()) {
            colis.villeActuelle = ville;
        }

        if (lieu != null && !lieu.isBlank()) {
            colis.lieuActuel = lieu;
        }

        if (latitude != null) {
            colis.latitude = latitude;
        }

        if (longitude != null) {
            colis.longitude = longitude;
        }

        // ----- Nouveau : PICKED_UP (ex-RECUPERE) -----
        if (nouveauStatut == StatutColis.PICKED_UP
                && colis.dateRamassage == null) {
            colis.dateRamassage = LocalDate.now();
            colis.heureRamassage = LocalTime.now();
        }

        // ----- Nouveau : DELIVERED (ex-LIVRE) -----
        if (nouveauStatut == StatutColis.DELIVERED) {
            colis.dateLivraisonEffective = LocalDate.now();
            colis.heureLivraisonEffective = LocalTime.now();
        }

        ajouterEtape(
                colis,
                nouveauStatut,
                valeurParDefaut(description, nouveauStatut.name()),
                colis.villeActuelle,
                colis.lieuActuel,
                colis.latitude,
                colis.longitude,
                valeurParDefaut(misAJourPar, "admin"),
                remarques,
                maintenant
        );

        return colisRepository.save(colis);
    }

    // =============================================================
    // DELETE
    // =============================================================
    public void supprimer(String id) {
        Colis colis = trouverParId(id);
        colisRepository.delete(colis);
    }

    // =============================================================
    // VALIDATION
    // =============================================================
    private void verifierPieces(Colis colis) {
        for (PieceColis piece : colis.packages) {
            if (piece == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "A package entry is empty."
                );
            }

            if (piece.quantite == null) {
                piece.quantite = 1;
            }

            if (piece.quantite <= 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Each package quantity must be positive."
                );
            }

            verifierDimension(piece.longueurCm, "length");
            verifierDimension(piece.largeurCm, "width");
            verifierDimension(piece.hauteurCm, "height");

            if (piece.poidsKg != null && piece.poidsKg < 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "A package weight cannot be negative."
                );
            }
        }
    }

    private void verifierDimension(Double valeur, String nom) {
        if (valeur != null && valeur < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "The " + nom + " cannot be negative."
            );
        }
    }

    // =============================================================
    // CALCULS
    // =============================================================
    private void calculerTotaux(Colis colis) {
        double volumeTotal = 0;
        double poidsVolumetriqueTotal = 0;
        double poidsReelTotal = 0;

        for (PieceColis piece : colis.packages) {
            int quantite = piece.quantite == null ? 1 : piece.quantite;

            if (piece.longueurCm != null
                    && piece.largeurCm != null
                    && piece.hauteurCm != null) {

                double volumePiece =
                        piece.longueurCm * piece.largeurCm * piece.hauteurCm
                                / 1_000_000.0;

                // Volumetric divisor — adjust to carrier rules if needed.
                double poidsVolumetriquePiece =
                        piece.longueurCm * piece.largeurCm * piece.hauteurCm
                                / 5000.0;

                piece.volumeM3 = volumePiece;
                piece.poidsVolumetriqueKg = poidsVolumetriquePiece;

                volumeTotal += volumePiece * quantite;
                poidsVolumetriqueTotal += poidsVolumetriquePiece * quantite;
            } else {
                piece.volumeM3 = null;
                piece.poidsVolumetriqueKg = null;
            }

            if (piece.poidsKg != null) {
                poidsReelTotal += piece.poidsKg * quantite;
            }
        }

        colis.volumeTotal = volumeTotal;
        colis.poidsVolumetriqueTotal = poidsVolumetriqueTotal;

        if (!colis.packages.isEmpty()) {
            colis.poidsReelTotal = poidsReelTotal;
        } else {
            colis.poidsReelTotal = colis.poids;
        }
    }

    // =============================================================
    // GÉNÉRATION DU CODE DE SUIVI
    // =============================================================
    private String genererCodeSuivi() {
        String code;

        do {
            code = "TRK-" + UUID.randomUUID()
                    .toString()
                    .replace("-", "")
                    .substring(0, 12)
                    .toUpperCase(Locale.ROOT);
        } while (colisRepository.existsByCodeSuivi(code));

        return code;
    }

    // =============================================================
    // AJOUT D'UNE ÉTAPE D'HISTORIQUE
    // =============================================================
    private void ajouterEtape(
            Colis colis,
            StatutColis statut,
            String description,
            String ville,
            String lieu,
            Double latitude,
            Double longitude,
            String auteur,
            String remarques,
            Instant maintenant
    ) {
        EtapeSuivi etape = new EtapeSuivi();

        etape.statut = statut;
        etape.description = description;
        etape.date = LocalDate.now();
        etape.heure = LocalTime.now().withNano(0);
        etape.ville = ville;
        etape.lieu = lieu;
        etape.latitude = latitude;
        etape.longitude = longitude;
        etape.misAJourPar = auteur;
        etape.remarques = remarques;
        etape.dateEnregistrement = maintenant;

        colis.historique.add(etape);
    }

    // =============================================================
    // HELPERS
    // =============================================================
    private void exigerTexte(String valeur, String message) {
        if (valeur == null || valeur.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private String valeurParDefaut(String valeur, String defaut) {
        return valeur == null || valeur.isBlank() ? defaut : valeur;
    }
}