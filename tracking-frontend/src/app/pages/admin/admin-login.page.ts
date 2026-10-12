import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-login-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-login.page.html',
  styleUrl: './admin-login.page.scss'
})
export class AdminLoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  motDePasse = '';
  erreur = '';
  chargement = false;

  connexion(): void {
    if (this.chargement) return;

    this.erreur = '';

    if (!this.email.trim() || !this.motDePasse.trim()) {
      this.erreur = 'Veuillez saisir votre email et votre mot de passe.';
      return;
    }

    this.chargement = true;

    this.auth.login(this.email, this.motDePasse).subscribe({
      next: () => {
        this.chargement = false;
        this.router.navigate(['/admin/colis']);
      },
      error: (err) => {
        this.chargement = false;
        if (err.status === 401) {
          this.erreur = 'Email ou mot de passe incorrect.';
        } else if (err.status === 403) {
          this.erreur = 'Compte désactivé.';
        } else {
          this.erreur = 'Erreur de connexion. Réessayez plus tard.';
        }
      }
    });
  }
}