import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface HistoriqueColis {
  statut: string;
  description?: string;
  date?: string;
  heure?: string;
  ville?: string;
  lieu?: string;
  misAJourPar?: string;
  remarques?: string;
  dateEnregistrement?: string;
}

export interface PackageColis {
  quantite?: number;
  typePiece?: string;
  description?: string;
  longueurCm?: number;
  largeurCm?: number;
  hauteurCm?: number;
  poidsKg?: number;
  volumeM3?: number;
  poidsVolumetriqueKg?: number;
}

export interface ColisSuivi {
   id?: string; 
  codeSuivi: string;
  statut: string;
  nomExpediteur?: string;
  nomDestinataire?: string;
  villeOrigine?: string;
  paysOrigine?: string;
  villeDestination?: string;
  paysDestination?: string;
  transporteur?: string;
  typeExpedition?: string;
  modeTransport?: string;
  referenceTransporteur?: string;
  description?: string;
  produit?: string;
  quantite?: number;
  poids?: number;
  poidsReelTotal?: number;
  poidsVolumetriqueTotal?: number;
  volumeTotal?: number;
  dateLivraisonPrevue?: string;
  dateRamassage?: string;
  heureRamassage?: string;
  dateDepart?: string;
  heureDepart?: string;
  dateLivraisonEffective?: string;
  heureLivraisonEffective?: string;
  villeActuelle?: string;
  lieuActuel?: string;
  latitude?: number | null;
  longitude?: number | null;
  commentaires?: string;
  packages?: PackageColis[];
  historique?: HistoriqueColis[];
  dateCreation?: string;
  dateModification?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TrackingService {
  private readonly http = inject(HttpClient);

  suivreColis(code: string): Observable<ColisSuivi> {
    const codeEncode = encodeURIComponent(code.trim());
    return this.http.get<ColisSuivi>(`/api/tracking/${codeEncode}`);
  }
}