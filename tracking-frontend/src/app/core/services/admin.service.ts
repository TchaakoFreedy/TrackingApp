import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ColisSuivi } from './tracking.service';

export interface ColisAdminPayload {
  nomExpediteur: string;
  telephoneExpediteur?: string;
  emailExpediteur?: string;
  adresseExpediteur?: string;
  villeExpediteur?: string;
  paysExpediteur?: string;

  nomDestinataire: string;
  telephoneDestinataire?: string;
  emailDestinataire?: string;
  adresseDestinataire?: string;
  villeDestinataire?: string;
  paysDestinataire?: string;

  adresseOrigine?: string;
  villeOrigine: string;
  paysOrigine?: string;
  adresseDestination?: string;
  villeDestination: string;
  paysDestination?: string;

  transporteur?: string;
  typeExpedition?: string;
  modeTransport?: string;
  referenceTransporteur?: string;

  description?: string;
  produit?: string;
  quantite?: number;
  poids?: number;

  modePaiement?: string;
  fraisTransport?: number;
  devise?: string;

  dateLivraisonPrevue?: string;
  commentaires?: string;

  villeActuelle?: string;
  lieuActuel?: string;
  latitude?: number;
  longitude?: number;

  codeSuivi?: string;
  statut?: string;
}

export interface UpdateStatutPayload {
  statut: string;
  description?: string;
  villeActuelle?: string;
  lieuActuel?: string;
  latitude?: number;
  longitude?: number;
  misAJourPar?: string;
  remarques?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/admin/colis';

  lister(): Observable<ColisSuivi[]> {
    return this.http.get<ColisSuivi[]>(this.base);
  }

  detail(id: string): Observable<ColisSuivi> {
    return this.http.get<ColisSuivi>(`${this.base}/${id}`);
  }

  creer(colis: ColisAdminPayload): Observable<ColisSuivi> {
    return this.http.post<ColisSuivi>(this.base, colis);
  }

  majStatut(id: string, payload: UpdateStatutPayload): Observable<ColisSuivi> {
    return this.http.patch<ColisSuivi>(`${this.base}/${id}/statut`, payload);
  }

  supprimer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}