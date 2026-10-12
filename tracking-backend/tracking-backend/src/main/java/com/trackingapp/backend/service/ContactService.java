package com.trackingapp.backend.service;

import com.trackingapp.backend.model.Contact;
import com.trackingapp.backend.repository.ContactRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
public class ContactService {

    private final ContactRepository contactRepository;

    public ContactService(ContactRepository contactRepository) {
        this.contactRepository = contactRepository;
    }

    public Contact enregistrer(Contact contact) {
        if (contact == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Les données du message sont obligatoires.");
        }

        exiger(contact.nom, "Le nom est obligatoire.");
        exiger(contact.email, "L'email est obligatoire.");
        exiger(contact.message, "Le message est obligatoire.");

        contact.dateCreation = Instant.now();
        contact.statut = "NOUVEAU";

        return contactRepository.save(contact);
    }

    public List<Contact> listerTous() {
        return contactRepository.findAllByOrderByDateCreationDesc();
    }

    public List<Contact> listerParStatut(String statut) {
        if (statut == null || statut.isBlank()) {
            return listerTous();
        }
        return contactRepository.findByStatutOrderByDateCreationDesc(statut);
    }

    public Contact trouverParId(String id) {
        return contactRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Message introuvable."));
    }

    public Contact mettreAJourStatut(String id, String statut, String reponseAdmin) {
        Contact c = trouverParId(id);

        if (statut != null && !statut.isBlank()) {
            c.statut = statut;
        }

        if (reponseAdmin != null && !reponseAdmin.isBlank()) {
            c.reponseAdmin = reponseAdmin;
        }

        c.dateTraitement = Instant.now();
        return contactRepository.save(c);
    }

    public long compterNouveaux() {
        return contactRepository.countByStatut("NOUVEAU");
    }

    public void supprimer(String id) {
        Contact c = trouverParId(id);
        contactRepository.delete(c);
    }

    private void exiger(String valeur, String message) {
        if (valeur == null || valeur.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }
}