package com.trackingapp.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "colis")
public class Colis {

    @Id
    public String id;

    @Indexed(unique = true)
    public String codeSuivi;

    // Expéditeur
    public String nomExpediteur;
    public String telephoneExpediteur;
    public String emailExpediteur;
    public String adresseExpediteur;
    public String villeExpediteur;
    public String paysExpediteur;

    // Destinataire
    public String nomDestinataire;
    public String telephoneDestinataire;
    public String emailDestinataire;
    public String adresseDestinataire;
    public String villeDestinataire;
    public String paysDestinataire;

    // Origine et destination
    public String adresseOrigine;
    public String villeOrigine;
    public String paysOrigine;
    public String adresseDestination;
    public String villeDestination;
    public String paysDestination;

    // Transport
    public String transporteur;
    public String typeExpedition;
    public String modeTransport;
    public String referenceTransporteur;

    // Marchandise
    public String description;
    public String produit;
    public Integer quantite;
    public Double poids;

    // Facturation
    public String modePaiement;
    public BigDecimal fraisTransport;
    public String devise;

    // Dates et heures
    public LocalDate dateLivraisonPrevue;
    public LocalDate dateRamassage;
    public LocalTime heureRamassage;
    public LocalDate dateDepart;
    public LocalTime heureDepart;
    public LocalDate dateLivraisonEffective;
    public LocalTime heureLivraisonEffective;

    // Statut et localisation actuelle
    public StatutColis statut;
    public String villeActuelle;
    public String lieuActuel;
    public Double latitude;
    public Double longitude;

    // Informations complémentaires
    public String commentaires;
    public String creePar;
    public Instant dateCreation;
    public Instant dateModification;

    // Colis physiques composant l'expédition
    public List<PieceColis> packages = new ArrayList<>();

    // Valeurs calculées à partir des dimensions et poids
    public Double poidsVolumetriqueTotal;
    public Double volumeTotal;
    public Double poidsReelTotal;

    // Historique du suivi
    public List<EtapeSuivi> historique = new ArrayList<>();

    public Colis() {
    }

    public static class PieceColis {
        public Integer quantite;
        public String typePiece;
        public String description;
        public Double longueurCm;
        public Double largeurCm;
        public Double hauteurCm;
        public Double poidsKg;
        public Double volumeM3;
        public Double poidsVolumetriqueKg;

        public PieceColis() {
        }
    }

    public static class EtapeSuivi {
        public StatutColis statut;
        public String description;
        public LocalDate date;
        public LocalTime heure;
        public String ville;
        public String lieu;
        public Double latitude;
        public Double longitude;
        public String misAJourPar;
        public String remarques;
        public Instant dateEnregistrement;

        public EtapeSuivi() {
        }
    }
}