import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';

import * as L from 'leaflet';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

import {
  TrackingService,
  ColisSuivi
} from '../../core/services/tracking.service';

@Component({
  selector: 'app-track-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './track.page.html',
  styleUrl: './track.page.scss'
})
export class TrackPage implements AfterViewInit, OnDestroy {
  private readonly trackingService = inject(TrackingService);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('mapContainer') mapContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('qrCanvas')      qrCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('barcodeCanvas') barcodeCanvas?: ElementRef<HTMLCanvasElement>;

  codeSuivi = '';
  colis: ColisSuivi | null = null;
  chargement = false;
  erreur = '';

  // Mode de la carte : rues ou satellite
  mapMode: 'streets' | 'satellite' = 'streets';

  readonly statuts = [
    'PENDING',
    'PICKED_UP',
    'IN_TRANSIT',
    'AT_DESTINATION',
    'OUT_FOR_DELIVERY',
    'DELIVERED'
  ] as const;

  private map?: L.Map;
  private streetsLayer?: L.TileLayer;
  private satelliteLayer?: L.TileLayer;

  ngAfterViewInit(): void {
    // Rien tant qu'aucun colis n'est chargé
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }

  suivreColis(): void {
    if (this.chargement) return;

    const code = this.codeSuivi.trim();
    this.erreur = '';

    if (!code) {
      this.colis = null;
      this.destroyMap();
      this.erreur = 'Please enter a tracking number.';
      this.cdr.detectChanges();
      return;
    }

    this.chargement = true;

    // Détruit la carte précédente avant nouvelle recherche
    this.destroyMap();
    this.cdr.detectChanges();

    this.trackingService
      .suivreColis(code)
      .pipe(
        timeout({ first: 15000 }),
        finalize(() => {
          this.chargement = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (resultat) => {
          if (!resultat || !resultat.codeSuivi) {
            this.colis = null;
            this.erreur = 'Invalid response from the server.';
            this.cdr.detectChanges();
            return;
          }

          this.colis = resultat;
          this.codeSuivi = resultat.codeSuivi;
          this.erreur = '';
          this.cdr.detectChanges();

          // Attendre que le DOM soit rendu (bloc @if vient de s'afficher)
          setTimeout(() => {
            this.cdr.detectChanges();
            // Deuxième délai pour laisser le navigateur calculer la hauteur du conteneur
            setTimeout(() => {
              this.renderMap();
              void this.renderQrCode();
              this.renderBarcode();
            }, 60);
          }, 60);
        },
        error: (error: HttpErrorResponse | Error) => {
          this.colis = null;
          this.destroyMap();

          if (error.name === 'TimeoutError') {
            this.erreur = 'The request timed out. Please try again.';
          } else if (error instanceof HttpErrorResponse) {
            switch (error.status) {
              case 0:
                this.erreur = 'Server unreachable. Check your connection.';
                break;
              case 401:
                this.erreur = 'Authentication required.';
                break;
              case 403:
                this.erreur = 'Access denied.';
                break;
              case 404:
                this.erreur = 'No shipment found for this tracking number.';
                break;
              default:
                this.erreur = `Server error (HTTP ${error.status}).`;
            }
          } else {
            this.erreur = 'An unexpected error occurred.';
          }

          this.cdr.detectChanges();
        }
      });
  }

  // =============================================================
  // CARTE — fond uniquement, AUCUN marqueur / point / cercle
  // =============================================================
  private destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
    this.streetsLayer = undefined;
    this.satelliteLayer = undefined;
  }

  private renderMap(): void {
    if (!this.colis) return;

    const el = this.mapContainer?.nativeElement;
    if (!el) {
      console.warn('[MAP] #mapContainer introuvable');
      return;
    }

    // Sécurité : force une hauteur si le CSS n'a pas été appliqué
    if (el.offsetHeight < 50) {
      el.style.height = '420px';
      el.style.width = '100%';
    }

    const lat = this.colis.latitude;
    const lng = this.colis.longitude;

    if (lat == null || lng == null) {
      this.destroyMap();
      return;
    }

    // Si la carte existe déjà, on recentre simplement
    if (this.map) {
      this.map.flyTo([lat, lng], 13, { duration: 1.2, easeLinearity: 0.25 });
      setTimeout(() => this.map?.invalidateSize(), 200);
      return;
    }

    // Création de la carte Leaflet — centrée sur les coordonnées
    // mais SANS aucun marqueur, point ou cercle ajouté
    this.map = L.map(el, {
      center: [lat, lng],
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: true,
      dragging: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
      touchZoom: true,
      preferCanvas: true,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true
    });

    // Couche "streets"
    this.streetsLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        maxNativeZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
        crossOrigin: true
      }
    );

    // Couche "satellite" (Esri World Imagery)
    this.satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        maxNativeZoom: 19,
        attribution:
          'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
        crossOrigin: true
      }
    );

    this.applyMapMode();

    // Leaflet a besoin d'un invalidateSize après le rendu complet
    setTimeout(() => this.map?.invalidateSize(), 200);
    setTimeout(() => this.map?.invalidateSize(), 500);
  }

  toggleMapMode(): void {
    this.mapMode = this.mapMode === 'streets' ? 'satellite' : 'streets';
    this.applyMapMode();
  }

  private applyMapMode(): void {
    if (!this.map || !this.streetsLayer || !this.satelliteLayer) return;

    if (this.mapMode === 'streets') {
      if (this.map.hasLayer(this.satelliteLayer)) {
        this.map.removeLayer(this.satelliteLayer);
      }
      if (!this.map.hasLayer(this.streetsLayer)) {
        this.streetsLayer.addTo(this.map);
      }
    } else {
      if (this.map.hasLayer(this.streetsLayer)) {
        this.map.removeLayer(this.streetsLayer);
      }
      if (!this.map.hasLayer(this.satelliteLayer)) {
        this.satelliteLayer.addTo(this.map);
      }
    }
  }

  // =============================================================
  // QR CODE
  // =============================================================
  private async renderQrCode(): Promise<void> {
    if (!this.colis) return;
    const canvas = this.qrCanvas?.nativeElement;
    if (!canvas) return;

    const url = `${window.location.origin}/track?code=${this.colis.codeSuivi}`;

    try {
      await QRCode.toCanvas(canvas, url, {
        width: 180,
        margin: 1,
        color: { dark: '#0c1e33', light: '#ffffff' }
      });
    } catch (e) {
      console.warn('[QR] render failed', e);
    }
  }

  // =============================================================
  // CODE-BARRES
  // =============================================================
  private renderBarcode(): void {
    if (!this.colis) return;
    const canvas = this.barcodeCanvas?.nativeElement;
    if (!canvas) return;

    try {
      JsBarcode(canvas, this.colis.codeSuivi, {
        format: 'CODE128',
        lineColor: '#0c1e33',
        width: 2,
        height: 70,
        displayValue: true,
        fontSize: 14,
        margin: 8
      });
    } catch {
      // ignore
    }
  }

  // =============================================================
  // HELPERS
  // =============================================================
  isStepDone(current: string | undefined, step: string): boolean {
    if (!current) return false;
    const order = this.statuts as readonly string[];
    const i = order.indexOf(current);
    const j = order.indexOf(step);
    if (i === -1 || j === -1) return false;
    return i >= j;
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
    if (!statut) return 'Status unavailable';
    return libelles[statut] ?? statut.replaceAll('_', ' ');
  }

  googleMapsUrl(lat: number, lng: number): string {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }

  printTracking(): void {
    window.print();
  }
}