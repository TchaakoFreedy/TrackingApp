import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ContactMessage {
  id?: string;
  nom: string;
  email: string;
  telephone?: string;
  reference?: string;
  message: string;
  statut?: string;        // NOUVEAU, EN_COURS, TRAITE, ARCHIVE
  reponseAdmin?: string;
  dateCreation?: string;
  dateTraitement?: string;
}

export interface ContactUpdatePayload {
  statut?: string;
  reponseAdmin?: string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/admin/contact';

  lister(statut?: string): Observable<ContactMessage[]> {
    const url = statut ? `${this.base}?statut=${statut}` : this.base;
    return this.http.get<ContactMessage[]>(url);
  }

  detail(id: string): Observable<ContactMessage> {
    return this.http.get<ContactMessage>(`${this.base}/${id}`);
  }

  compterNouveaux(): Observable<number> {
    return this.http.get<number>(`${this.base}/nouveaux/count`);
  }

  mettreAJour(id: string, payload: ContactUpdatePayload): Observable<ContactMessage> {
    return this.http.patch<ContactMessage>(`${this.base}/${id}`, payload);
  }

  supprimer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}