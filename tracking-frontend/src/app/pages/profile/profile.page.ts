import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProfileService, UserProfile } from '../../core/services/profile.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss'
})
export class ProfilePage implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly cdr = inject(ChangeDetectorRef);

  user: UserProfile | null = null;

  model = {
    nom: '',
    email: '',
    nouveauMotDePasse: '',
    motDePasseActuel: ''
  };

  message = '';
  erreur = '';
  chargement = false;

  ngOnInit(): void {
    this.chargerProfil();
  }

  chargerProfil(): void {
    this.chargement = true;
    this.cdr.detectChanges();

    this.profileService.monProfil().subscribe({
      next: (u) => {
        this.user = u;
        this.model.nom = u.nom ?? '';
        this.model.email = u.email ?? '';
        this.chargement = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        // Diagnostic détaillé
        if (err.status === 401) {
          this.erreur = 'Session expired. Please log in again.';
        } else if (err.status === 403) {
          this.erreur = 'Access denied. Contact an administrator.';
        } else if (err.status === 404) {
          this.erreur = 'User profile not found.';
        } else {
          this.erreur = `Unable to load your profile. (HTTP ${err.status ?? '?'})`;
        }
        this.chargement = false;
        this.cdr.detectChanges();
      }
    });
  }

  enregistrer(): void {
    this.message = '';
    this.erreur = '';

    if (!this.model.nom.trim() || !this.model.email.trim()) {
      this.erreur = 'Name and email are required.';
      this.cdr.detectChanges();
      return;
    }

    this.chargement = true;
    this.cdr.detectChanges();

    this.profileService.mettreAJourProfil({
      nom: this.model.nom,
      email: this.model.email,
      nouveauMotDePasse: this.model.nouveauMotDePasse || undefined,
      motDePasseActuel: this.model.motDePasseActuel || undefined
    }).subscribe({
      next: (u) => {
        this.user = u;
        this.message = 'Profile updated successfully.';
        this.model.nouveauMotDePasse = '';
        this.model.motDePasseActuel = '';
        this.chargement = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.erreur = err?.error?.message || 'Error while updating profile.';
        this.chargement = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ✅ Méthode MANQUANTE — c'était la cause de la page blanche
  formatDate(date: string | undefined): string {
    if (!date) return '—';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return date;
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(d);
  }
}