export interface TestSession {
  id: number;
  nom: string;
  description?: string;
  date_creation: string;
  statut: 'En cours' | 'Terminé' | 'Annulé';
  created_by: number;
  createdByUsername?: string;
  tests: Test[];
  total_tests: number;
  tests_ok: number;
  tests_bug: number;
  tests_en_cours: number;
  applicationId?: number;
  applicationNom?: string;
  nom_document?: string;
}

export interface Test {
  id: number;
  sessionId?: number;
  applicationId?: number;
  applicationNom?: string;
  version?: string;
  environnement?: string;
  fonction: string;
  precondition?: string;
  etapes?: string;
  resultatAttendu?: string;
  resultatObtenu?: string;
  statut: 'OK' | 'BUG' | 'EN COURS' | 'BLOQUE';
  commentaires?: string;
  image?: string;
  date_creation?: string;
  updated_at?: string;
}

export interface Application {
  id: number;
  nom: string;
  description?: string;
  version?: string;
  environnement?: string;
  dateCreation?: string;
  createdBy?: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  isActive?: boolean;
}

export interface CreateTestSessionRequest {
  nom: string;
  description?: string;
  applicationId?: number;
  nom_document?: string;
  statut: string;
}

export interface CreateTestRequest {
  sessionId?: number;
  applicationId?: number;
  fonction: string;
  precondition?: string;
  etapes?: string;
  resultatAttendu?: string;
  resultatObtenu?: string;
  statut: string;
  commentaires?: string;
  image?: string;
}
