import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserProfile {
  id?: string;
  nom: string;
  email: string;
  role: string;
  actif: boolean;
  dateCreation?: string;
  dateDerniereConnexion?: string;
}

export interface UpdateProfilePayload {
  nom?: string;
  email?: string;
  nouveauMotDePasse?: string;
  motDePasseActuel?: string;
}

export interface CreateUserPayload {
  email: string;
  nom: string;
  motDePasse: string;
  role?: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/users';

  monProfil(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.base}/me`);
  }

  mettreAJourProfil(payload: UpdateProfilePayload): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.base}/me`, payload);
  }

  // ADMIN
  listerUtilisateurs(): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(this.base);
  }

  creerUtilisateur(payload: CreateUserPayload): Observable<UserProfile> {
    return this.http.post<UserProfile>(this.base, payload);
  }

  changerRole(id: string, role: string): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${this.base}/${id}/role`, { role });
  }

  activerDesactiver(id: string, actif: boolean): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${this.base}/${id}/actif`, { actif });
  }

  supprimer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}