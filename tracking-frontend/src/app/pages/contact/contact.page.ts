import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RevealDirective } from '../../core/directives/reveal.directive';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [FormsModule, RevealDirective],
  templateUrl: './contact.page.html',
  styleUrl: './contact.page.scss'
})
export class ContactPage {
  private readonly http = inject(HttpClient);

  nom = '';
  email = '';
  reference = '';
  message = '';

  confirmation = '';
  erreur = '';
  chargement = false;

  envoyerMessage(): void {
    if (this.chargement) return;

    this.erreur = '';
    this.confirmation = '';

    if (!this.nom.trim() || !this.email.trim() || !this.message.trim()) {
      this.erreur = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }

    this.chargement = true;

    this.http
      .post('/api/contact', {
        nom: this.nom,
        email: this.email,
        reference: this.reference,
        message: this.message
      })
      .subscribe({
        next: () => {
          this.confirmation =
            'Merci ! Votre message a bien été envoyé. Nous vous répondrons rapidement.';
          this.nom = '';
          this.email = '';
          this.reference = '';
          this.message = '';
          this.chargement = false;
        },
        error: () => {
          this.erreur =
            "Une erreur s'est produite lors de l'envoi. Réessayez plus tard.";
          this.chargement = false;
        }
      });
  }
}