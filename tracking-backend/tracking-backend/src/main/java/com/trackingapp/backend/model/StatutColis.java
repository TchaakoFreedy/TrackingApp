package com.trackingapp.backend.model;

public enum StatutColis {
    PENDING,                // EN_ATTENTE
    PICKED_UP,              // RECUPERE
    IN_TRANSIT,             // EN_TRANSIT
    AT_DESTINATION,         // ARRIVE_A_DESTINATION
    OUT_FOR_DELIVERY,       // EN_LIVRAISON
    DELIVERED,              // LIVRE
    DELIVERY_FAILED,        // ECHEC_LIVRAISON
    RETURNED,               // RETOURNE
    CANCELLED               // ANNULE
}