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
  private readonly cdr = inject(ChangeDetectorRef);

  colis: ColisSuivi[] = [];
  filtres = '';
  statutFiltre = '';
  chargement = false;
  erreur = '';

  // ✅ Statuts alignés avec le reste de l'app (anglais)
  readonly statuts = [
    '',
    'PENDING',
    'PICKED_UP',
    'IN_TRANSIT',
    'AT_DESTINATION',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'DELIVERY_FAILED',
    'RETURNED',
    'CANCELLED'
  ];

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.chargement = true;
    this.erreur = '';
    this.cdr.detectChanges();

    this.admin.lister().subscribe({
      next: (data: ColisSuivi[]) => {
        this.colis = data ?? [];
        this.chargement = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.erreur = 'Unable to load shipments.';
        this.chargement = false;
        this.cdr.detectChanges();
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
      PENDING:            'Pending',
      PICKED_UP:          'Picked Up',
      IN_TRANSIT:         'In Transit',
      AT_DESTINATION:     'At Destination',
      OUT_FOR_DELIVERY:   'Out for Delivery',
      DELIVERED:          'Delivered',
      DELIVERY_FAILED:    'Delivery Failed',
      RETURNED:           'Returned',
      CANCELLED:          'Cancelled'
    };
    if (!statut) return '—';
    return libelles[statut] ?? statut.replaceAll('_', ' ');
  }

  supprimer(c: ColisSuivi): void {
    if (!c.id) return;
    if (!confirm(`Permanently delete shipment ${c.codeSuivi}?`)) return;

    this.admin.supprimer(c.id).subscribe({
      next: () => this.charger(),
      error: () => {
        this.erreur = 'Error while deleting the shipment.';
        this.cdr.detectChanges();
      }
    });
  }
}