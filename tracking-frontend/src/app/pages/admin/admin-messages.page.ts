import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  ContactService,
  ContactMessage
} from '../../core/services/contact.service';

@Component({
  selector: 'app-admin-messages-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-messages.page.html',
  styleUrl: './admin-messages.page.scss'
})
export class AdminMessagesPage implements OnInit {
  private readonly contactService = inject(ContactService);
  private readonly cdr = inject(ChangeDetectorRef);

  messages: ContactMessage[] = [];
  filtreStatut = '';
  filtreTexte = '';
  chargement = false;
  erreur = '';
  messageSelectionne: ContactMessage | null = null;

  readonly statuts = [
    '',
    'NOUVEAU',
    'EN_COURS',
    'TRAITE',
    'ARCHIVE'
  ];

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.chargement = true;
    this.erreur = '';
    this.cdr.detectChanges();

    this.contactService.lister().subscribe({
      next: (data) => {
        this.messages = data ?? [];
        this.chargement = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.erreur = 'Impossible de charger les messages.';
        this.chargement = false;
        this.cdr.detectChanges();
      }
    });
  }

  get messagesFiltres(): ContactMessage[] {
    const q = this.filtreTexte.trim().toLowerCase();
    return this.messages.filter((m) => {
      const matchStatut = !this.filtreStatut || m.statut === this.filtreStatut;
      const matchTexte =
        !q ||
        (m.nom ?? '').toLowerCase().includes(q) ||
        (m.email ?? '').toLowerCase().includes(q) ||
        (m.message ?? '').toLowerCase().includes(q) ||
        (m.reference ?? '').toLowerCase().includes(q);
      return matchStatut && matchTexte;
    });
  }

  ouvrirDetail(m: ContactMessage): void {
    this.messageSelectionne = m;
  }

  fermerDetail(): void {
    this.messageSelectionne = null;
  }

  marquerTraite(m: ContactMessage): void {
    if (!m.id) return;
    this.contactService
      .mettreAJour(m.id, { statut: 'TRAITE' })
      .subscribe({
        next: () => {
          this.fermerDetail();
          this.charger();
        }
      });
  }

  marquerEnCours(m: ContactMessage): void {
    if (!m.id) return;
    this.contactService
      .mettreAJour(m.id, { statut: 'EN_COURS' })
      .subscribe({
        next: () => {
          this.fermerDetail();
          this.charger();
        }
      });
  }

  archiver(m: ContactMessage): void {
    if (!m.id) return;
    this.contactService
      .mettreAJour(m.id, { statut: 'ARCHIVE' })
      .subscribe({
        next: () => {
          this.fermerDetail();
          this.charger();
        }
      });
  }

  supprimer(m: ContactMessage): void {
    if (!m.id) return;
    if (!confirm(`Supprimer définitivement le message de ${m.nom} ?`)) return;

    this.contactService.supprimer(m.id).subscribe({
      next: () => {
        this.fermerDetail();
        this.charger();
      },
      error: () => {
        this.erreur = 'Erreur lors de la suppression.';
        this.cdr.detectChanges();
      }
    });
  }

  libelleStatut(statut: string | undefined): string {
    const libelles: Record<string, string> = {
      NOUVEAU: 'Nouveau',
      EN_COURS: 'En cours',
      TRAITE: 'Traité',
      ARCHIVE: 'Archivé'
    };
    if (!statut) return '—';
    return libelles[statut] ?? statut;
  }

  formatDate(date: string | undefined): string {
    if (!date) return '—';
    try {
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(date));
    } catch {
      return date;
    }
  }
}