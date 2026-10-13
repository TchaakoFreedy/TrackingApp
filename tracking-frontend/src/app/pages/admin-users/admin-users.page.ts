import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProfileService, UserProfile } from '../../core/services/profile.service';

@Component({
  selector: 'app-admin-users-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-users.page.html',
  styleUrl: './admin-users.page.scss'
})
export class AdminUsersPage implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly cdr = inject(ChangeDetectorRef);

  users: UserProfile[] = [];
  chargement = false;
  erreur = '';
  message = '';

  showCreateForm = false;
  nouveau = { nom: '', email: '', motDePasse: '', role: 'OPERATEUR' };

  readonly roles = ['ADMIN', 'OPERATEUR'];

  ngOnInit(): void { this.charger(); }

  charger(): void {
    this.chargement = true;
    this.cdr.detectChanges();
    this.profileService.listerUtilisateurs().subscribe({
      next: (data) => {
        this.users = data ?? [];
        this.chargement = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.erreur = 'Unable to load users.';
        this.chargement = false;
        this.cdr.detectChanges();
      }
    });
  }

  creer(): void {
    this.erreur = '';
    this.message = '';

    if (!this.nouveau.nom.trim() || !this.nouveau.email.trim() || !this.nouveau.motDePasse.trim()) {
      this.erreur = 'Name, email and password are required.';
      this.cdr.detectChanges();
      return;
    }

    this.chargement = true;
    this.cdr.detectChanges();

    this.profileService.creerUtilisateur(this.nouveau).subscribe({
      next: () => {
        this.message = 'User created successfully.';
        this.nouveau = { nom: '', email: '', motDePasse: '', role: 'OPERATEUR' };
        this.showCreateForm = false;
        this.chargement = false;
        this.charger();
      },
      error: (err) => {
        this.erreur = err?.error?.message || 'Error while creating user.';
        this.chargement = false;
        this.cdr.detectChanges();
      }
    });
  }

  changerRole(u: UserProfile, role: string): void {
    if (!u.id || u.role === role) return;
    this.profileService.changerRole(u.id, role).subscribe({
      next: () => this.charger(),
      error: () => { this.erreur = 'Error while updating role.'; this.cdr.detectChanges(); }
    });
  }

  toggleActif(u: UserProfile): void {
    if (!u.id) return;
    this.profileService.activerDesactiver(u.id, !u.actif).subscribe({
      next: () => this.charger(),
      error: () => { this.erreur = 'Error while updating status.'; this.cdr.detectChanges(); }
    });
  }

  supprimer(u: UserProfile): void {
    if (!u.id) return;
    if (!confirm(`Delete user ${u.email}?`)) return;
    this.profileService.supprimer(u.id).subscribe({
      next: () => this.charger(),
      error: () => { this.erreur = 'Error while deleting user.'; this.cdr.detectChanges(); }
    });
  }

  formatDate(date: string | undefined): string {
    if (!date) return '—';
    const d = new Date(date);
    return Number.isNaN(d.getTime()) ? date :
      new Intl.DateTimeFormat('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
      }).format(d);
  }
}