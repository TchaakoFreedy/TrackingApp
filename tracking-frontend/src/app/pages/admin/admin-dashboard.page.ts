import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';
import { ColisSuivi } from '../../core/services/tracking.service';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-dashboard.page.html',
  styleUrl: './admin-dashboard.page.scss'
})
export class AdminDashboardPage implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly cdr = inject(ChangeDetectorRef);   // ← AJOUT

  colis: ColisSuivi[] = [];
  filtres = '';
  statutFiltre = '';
  chargement = false;
  erreur = '';

  readonly statuts = [
    '',
    'EN_ATTENTE',
    'RECUPERE',
    'EN_TRANSIT',
    'ARRIVE_A_DESTINATION',
    'EN_LIVRAISON',
    'LIVRE',
    'ECHEC_LIVRAISON',
    'RETOURNE',
    'ANNULE'
  ];

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.chargement = true;
    this.erreur = '';
    this.cdr.detectChanges();   // ← AJOUT

    this.admin.lister().subscribe({
      next: (data: ColisSuivi[]) => {
        this.colis = data ?? [];
        this.chargement = false;
        this.cdr.detectChanges();   // ← AJOUT (le plus important)
      },
      error: () => {
        this.erreur = 'Impossible de charger les colis.';
        this.chargement = false;
        this.cdr.detectChanges();   // ← AJOUT
      }
    });
  }

  countByStatut(statut: string): number {
  return this.colis.filter((c) => c.statut === statut).length;
}

  get colisFiltres(): ColisSuivi[] {
    const q = this.filtres.trim().toLowerCase();
    return this.colis.filter((c) => {
      const matchQ =
        !q ||
        (c.codeSuivi ?? '').toLowerCase().includes(q) ||
        (c.nomExpediteur ?? '').toLowerCase().includes(q) ||
        (c.nomDestinataire ?? '').toLowerCase().includes(q) ||
        (c.villeDestination ?? '').toLowerCase().includes(q);

      const matchS = !this.statutFiltre || c.statut === this.statutFiltre;
      return matchQ && matchS;
    });
  }

  libelleStatut(statut: string | undefined): string {
    const libelles: Record<string, string> = {
      EN_ATTENTE: 'En attente',
      RECUPERE: 'Récupéré',
      EN_TRANSIT: 'En transit',
      ARRIVE_A_DESTINATION: 'Arrivé',
      EN_LIVRAISON: 'En livraison',
      LIVRE: 'Livré',
      ECHEC_LIVRAISON: 'Échec',
      RETOURNE: 'Retourné',
      ANNULE: 'Annulé'
    };
    if (!statut) return '—';
    return libelles[statut] ?? statut.replaceAll('_', ' ');
  }

  supprimer(c: ColisSuivi): void {
    if (!c.id) return;
    if (!confirm(`Supprimer définitivement le colis ${c.codeSuivi} ?`)) return;

    this.admin.supprimer(c.id).subscribe({
      next: () => this.charger(),
      error: () => {
        this.erreur = 'Erreur lors de la suppression.';
        this.cdr.detectChanges();   // ← AJOUT
      }
    });
  }
}