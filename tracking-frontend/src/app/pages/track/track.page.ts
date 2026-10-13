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
  private marker?: L.Marker;
  private accuracyCircle?: L.Circle;
  private streetsLayer?: L.TileLayer;
  private satelliteLayer?: L.TileLayer;

  ngAfterViewInit(): void {
    // Rien tant qu'aucun colis n'est chargé
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = undefined;
    this.marker = undefined;
    this.accuracyCircle = undefined;
  }

  suivreColis(): void {
    if (this.chargement) return;

    const code = this.codeSuivi.trim();
    this.erreur = '';

    if (!code) {
      this.colis = null;
      this.erreur = 'Please enter a tracking number.';
      this.cdr.detectChanges();
      return;
    }

    this.chargement = true;
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

          setTimeout(() => {
            this.renderMap();
            void this.renderQrCode();
            this.renderBarcode();
          }, 100);
        },
        error: (error: HttpErrorResponse | Error) => {
          this.colis = null;

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
  // CARTE
  // =============================================================
  private renderMap(): void {
    if (!this.colis) return;

    const el = this.mapContainer?.nativeElement;
    if (!el) {
      console.warn('[MAP] #mapContainer introuvable');
      return;
    }

    const lat = this.colis.latitude;
    const lng = this.colis.longitude;

    if (lat == null || lng == null) {
      this.map?.remove();
      this.map = undefined;
      this.marker = undefined;
      this.accuracyCircle = undefined;
      return;
    }

    // Création de la carte si elle n'existe pas encore
    if (!this.map) {
      this.map = L.map(el, {
        center: [lat, lng],
        zoom: 13,
        scrollWheelZoom: true,
        dragging: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        zoomControl: true,
        touchZoom: true
      });

      // Couche "streets"
      this.streetsLayer = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap'
        }
      );

      // Couche "satellite" (Esri World Imagery)
      this.satelliteLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
          attribution:
            'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
        }
      );

      this.applyMapMode();
    } else {
      // La carte existe déjà : on vole vers la nouvelle position
      this.map.flyTo([lat, lng], 13, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }

    // Icône personnalisée avec pulsation
    const icon = L.divIcon({
      className: 'aurex-marker',
      html: `
        <div class="aurex-marker-wrapper">
          <div class="aurex-marker-pulse"></div>
          <div class="aurex-marker-dot"></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -22]
    });

    // Marqueur
    if (this.marker) {
      this.marker.setLatLng([lat, lng]).setIcon(icon);
    } else {
      this.marker = L.marker([lat, lng], {
        icon,
        draggable: false,
        autoPan: true
      }).addTo(this.map!);
    }

    // ✅ Popup SANS villeActuelle / lieuActuel — uniquement coordonnées GPS
    this.marker.bindPopup(`
      <div class="aurex-popup">
        <strong>Shipment position</strong>
        <br>
        <small>${lat.toFixed(5)}, ${lng.toFixed(5)}</small>
      </div>
    `);

    this.marker.openPopup();

    // Cercle de précision
    const circleOptions: L.CircleOptions = {
      radius: 500,
      color: '#d7a94b',
      weight: 2,
      opacity: 0.6,
      fillColor: '#d7a94b',
      fillOpacity: 0.15
    };

    if (this.accuracyCircle) {
      this.accuracyCircle.setLatLng([lat, lng]);
    } else {
      this.accuracyCircle = L.circle([lat, lng], circleOptions).addTo(
        this.map!
      );
    }

    setTimeout(() => this.map?.invalidateSize(), 150);
  }

  // Bascule Streets / Satellite
  toggleMapMode(): void {
    this.mapMode = this.mapMode === 'streets' ? 'satellite' : 'streets';
    this.applyMapMode();
  }

  private applyMapMode(): void {
    if (!this.map || !this.streetsLayer || !this.satelliteLayer) return;

    if (this.mapMode === 'streets') {
      this.map.removeLayer(this.satelliteLayer);
      this.streetsLayer.addTo(this.map);
    } else {
      this.map.removeLayer(this.streetsLayer);
      this.satelliteLayer.addTo(this.map);
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

    await QRCode.toCanvas(canvas, url, {
      width: 180,
      margin: 1,
      color: { dark: '#0c1e33', light: '#ffffff' }
    });
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

  formatDate(date: string | undefined): string {
    if (!date) return 'To be confirmed';
    const valeur = new Date(`${date}T12:00:00`);
    if (Number.isNaN(valeur.getTime())) return date;
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(valeur);
  }

  googleMapsUrl(lat: number, lng: number): string {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }

  printTracking(): void {
    window.print();
  }
}