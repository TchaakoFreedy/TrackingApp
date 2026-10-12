package com.trackingapp.backend.controller;

import com.trackingapp.backend.model.Contact;
import com.trackingapp.backend.service.ContactService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
public class ContactController {

    private final ContactService contactService;

    public ContactController(ContactService contactService) {
        this.contactService = contactService;
    }

    // ============== PUBLIC ==============

    @PostMapping("/api/contact")
    public ResponseEntity<Contact> envoyer(@RequestBody Contact contact) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(contactService.enregistrer(contact));
    }

    // ============== ADMIN ==============

    @GetMapping("/api/admin/contact")
    public List<Contact> lister(@RequestParam(required = false) String statut) {
        return contactService.listerParStatut(statut);
    }

    @GetMapping("/api/admin/contact/{id}")
    public Contact detail(@PathVariable String id) {
        return contactService.trouverParId(id);
    }

    @GetMapping("/api/admin/contact/nouveaux/count")
    public long compterNouveaux() {
        return contactService.compterNouveaux();
    }

    @PatchMapping("/api/admin/contact/{id}")
    public Contact majStatut(
            @PathVariable String id,
            @RequestBody MiseAJourContactRequest req
    ) {
        return contactService.mettreAJourStatut(id, req.statut(), req.reponseAdmin());
    }

    @DeleteMapping("/api/admin/contact/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable String id) {
        contactService.supprimer(id);
        return ResponseEntity.noContent().build();
    }

    public record MiseAJourContactRequest(
            String statut,
            String reponseAdmin
    ) {
    }
}