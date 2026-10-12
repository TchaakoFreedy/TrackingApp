import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AdminService,
  ColisAdminPayload,
  UpdateStatutPayload
} from '../../core/services/admin.service';
import { ColisSuivi } from '../../core/services/tracking.service';

@Component({
  selector: 'app-admin-colis-form-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-colis-form.page.html',
  styleUrl: './admin-colis-form.page.scss'
})
export class AdminColisFormPage implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  id?: string;
  mode: 'creation' | 'edition' = 'creation';

  model: ColisAdminPayload = this.vide();

  statutMaj: UpdateStatutPayload = {
    statut: 'IN_TRANSIT',
    description: '',
    villeActuelle: '',
    lieuActuel: '',
    latitude: undefined,
    longitude: undefined,
    remarques: ''
  };

  readonly statuts = [
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

  message = '';
  erreur = '';
  chargement = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.id = id;
      this.mode = 'edition';
      this.chargerDetail(id);
    }
  }

  private vide(): ColisAdminPayload {
    return {
      nomExpediteur: '',
      nomDestinataire: '',
      villeOrigine: '',
      villeDestination: ''
    };
  }

  private chargerDetail(id: string): void {
    this.chargement = true;
    this.cdr.detectChanges();

    this.admin.detail(id).subscribe({
      next: (c: ColisSuivi) => {
        this.model = {
          nomExpediteur: c.nomExpediteur ?? '',
          nomDestinataire: c.nomDestinataire ?? '',
          villeOrigine: c.villeOrigine ?? '',
          paysOrigine: c.paysOrigine ?? '',
          villeDestination: c.villeDestination ?? '',
          paysDestination: c.paysDestination ?? '',
          transporteur: c.transporteur,
          typeExpedition: c.typeExpedition,
          modeTransport: c.modeTransport,
          produit: c.produit,
          quantite: c.quantite,
          poids: c.poids,
          description: c.description,
          dateLivraisonPrevue: c.dateLivraisonPrevue,
          commentaires: c.commentaires,
          villeActuelle: c.villeActuelle,
          lieuActuel: c.lieuActuel,
          latitude: c.latitude ?? undefined,
          longitude: c.longitude ?? undefined,
          codeSuivi: c.codeSuivi,
          statut: c.statut
        };

        this.statutMaj.villeActuelle = c.villeActuelle ?? '';
        this.statutMaj.lieuActuel = c.lieuActuel ?? '';
        this.statutMaj.latitude = c.latitude ?? undefined;
        this.statutMaj.longitude = c.longitude ?? undefined;

        this.statutMaj.statut = c.statut ?? 'IN_TRANSIT';

        this.chargement = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.erreur = 'Unable to load this shipment.';
        this.chargement = false;
        this.cdr.detectChanges();
      }
    });
  }

  creer(): void {
    this.message = '';
    this.erreur = '';

    if (
      !this.model.nomExpediteur?.trim() ||
      !this.model.nomDestinataire?.trim() ||
      !this.model.villeOrigine?.trim() ||
      !this.model.villeDestination?.trim()
    ) {
      this.erreur =
        'Sender, recipient, origin city and destination city are required.';
      this.cdr.detectChanges();
      return;
    }

    this.chargement = true;
    this.cdr.detectChanges();

    this.admin.creer(this.model).subscribe({
      next: (c: ColisSuivi) => {
        this.chargement = false;
        this.message = `Shipment created: ${c.codeSuivi}`;
        this.cdr.detectChanges();

        setTimeout(() => {
          if (c.id) this.router.navigate(['/admin/colis', c.id]);
        }, 900);
      },
      error: () => {
        this.chargement = false;
        this.erreur = 'Error while creating the shipment.';
        this.cdr.detectChanges();
      }
    });
  }

  // ✅ MÉTHODE AJOUTÉE ICI
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

  mettreAJourStatut(): void {
    if (!this.id) return;

    this.message = '';
    this.erreur = '';

    if (!this.statutMaj.statut) {
      this.erreur = 'Please select a status.';
      this.cdr.detectChanges();
      return;
    }

    this.chargement = true;
    this.cdr.detectChanges();

    this.admin.majStatut(this.id, this.statutMaj).subscribe({
      next: () => {
        this.message = 'Status updated successfully.';
        this.chargement = false;
        this.cdr.detectChanges();
        if (this.id) this.chargerDetail(this.id);
      },
      error: () => {
        this.erreur = 'Error while updating the status.';
        this.chargement = false;
        this.cdr.detectChanges();
      }
    });
  }
}