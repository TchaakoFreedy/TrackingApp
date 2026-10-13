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
  latitude?: number | null;
  longitude?: number | null;
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

  // ====== Expéditeur ======
  nomExpediteur?: string;
  telephoneExpediteur?: string;
  emailExpediteur?: string;
  adresseExpediteur?: string;
  villeExpediteur?: string;
  paysExpediteur?: string;

  // ====== Destinataire ======
  nomDestinataire?: string;
  telephoneDestinataire?: string;
  emailDestinataire?: string;
  adresseDestinataire?: string;
  villeDestinataire?: string;
  paysDestinataire?: string;

  // ====== Origine / Destination ======
  adresseOrigine?: string;
  villeOrigine?: string;
  paysOrigine?: string;
  adresseDestination?: string;
  villeDestination?: string;
  paysDestination?: string;

  // ====== Transport ======
  transporteur?: string;
  typeExpedition?: string;
  modeTransport?: string;
  referenceTransporteur?: string;

  // ====== Marchandise ======
  description?: string;
  produit?: string;
  quantite?: number;
  poids?: number;

  // ====== Facturation ======
  modePaiement?: string;
  fraisTransport?: number;
  devise?: string;

  // ====== Totaux calculés ======
  poidsReelTotal?: number;
  poidsVolumetriqueTotal?: number;
  volumeTotal?: number;

  // ====== Dates & heures ======
  dateLivraisonPrevue?: string;
  dateRamassage?: string;
  heureRamassage?: string;
  dateDepart?: string;
  heureDepart?: string;
  dateLivraisonEffective?: string;
  heureLivraisonEffective?: string;

  // ====== Statut actuel / localisation ======
  villeActuelle?: string;
  lieuActuel?: string;
  latitude?: number | null;
  longitude?: number | null;

  // ====== Complémentaires ======
  commentaires?: string;
  creePar?: string;
  dateCreation?: string;
  dateModification?: string;

  // ====== Colis physiques & historique ======
  packages?: PackageColis[];
  historique?: HistoriqueColis[];
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