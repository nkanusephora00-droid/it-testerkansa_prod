import { TestSession, Test, CreateTestSessionRequest, CreateTestRequest } from '../entities/TestSession';

export interface TestSessionRepository {
  getAll(): Promise<TestSession[]>;
  getById(id: number): Promise<TestSession>;
  create(data: CreateTestSessionRequest): Promise<TestSession>;
  update(id: number, data: Partial<TestSession>): Promise<TestSession>;
  delete(id: number): Promise<void>;
  getTestsBySession(sessionId: number): Promise<Test[]>;
}

export interface TestRepository {
  getAll(): Promise<Test[]>;
  getById(id: number): Promise<Test>;
  create(data: CreateTestRequest): Promise<Test>;
  update(id: number, data: Partial<Test>): Promise<Test>;
  delete(id: number): Promise<void>;
}

export class TestSessionUseCases {
  constructor(
    private sessionRepo: TestSessionRepository,
    private testRepo: TestRepository
  ) {}

  async getAllSessions(): Promise<TestSession[]> {
    return this.sessionRepo.getAll();
  }

  async createSession(data: CreateTestSessionRequest): Promise<TestSession> {
    if (!data.nom.trim()) {
      throw new Error('Le nom de la session est requis');
    }
    
    return this.sessionRepo.create({
      ...data,
      statut: 'En cours'
    });
  }

  async deleteSession(id: number): Promise<void> {
    const session = await this.sessionRepo.getById(id);
    if (session.statut === 'Terminé') {
      throw new Error('Impossible de supprimer une session terminée');
    }
    
    return this.sessionRepo.delete(id);
  }

  async getSessionWithTests(sessionId: number): Promise<TestSession> {
    const session = await this.sessionRepo.getById(sessionId);
    const tests = await this.testRepo.getAll();
    session.tests = tests.filter(test => test.sessionId === sessionId);
    
    // Recalculate statistics
    session.total_tests = session.tests.length;
    session.tests_ok = session.tests.filter(t => t.statut === 'OK').length;
    session.tests_bug = session.tests.filter(t => t.statut === 'BUG').length;
    session.tests_en_cours = session.tests.filter(t => t.statut === 'EN COURS').length;
    
    return session;
  }

  async createTest(data: CreateTestRequest): Promise<Test> {
    if (!data.fonction.trim()) {
      throw new Error('La fonction est requise');
    }
    if (!data.statut) {
      throw new Error('Le statut est requis');
    }
    
    return this.testRepo.create(data);
  }

  async updateTest(id: number, data: Partial<Test>): Promise<Test> {
    return this.testRepo.update(id, data);
  }

  async deleteTest(id: number): Promise<void> {
    return this.testRepo.delete(id);
  }

  async exportSessionToPDF(sessionId: number): Promise<void> {
    const session = await this.getSessionWithTests(sessionId);
    
    const printContent = this.generatePDFContent(session);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  }

  private generatePDFContent(session: TestSession): string {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('fr-FR', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rapport de Tests - ${session.nom}</title>
        <style>
          @page { size: A4 landscape; margin: 15mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #2c3e50; }
          .header h1 { font-size: 22px; color: #2c3e50; margin-bottom: 8px; }
          .session-info { display: flex; justify-content: center; gap: 25px; margin: 12px 0; }
          .stats { display: flex; justify-content: center; gap: 12px; margin-bottom: 15px; }
          .stat-box { padding: 8px 15px; border-radius: 6px; text-align: center; color: white; }
          .stat-total { background: #3498db; }
          .stat-ok { background: #27ae60; }
          .stat-bug { background: #e74c3c; }
          .stat-encours { background: #f39c12; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
          th { background-color: #f8f9fa; font-weight: 600; }
          tr:nth-child(even) { background-color: #f8f9fa; }
          .statut-ok { color: #27ae60; font-weight: 600; }
          .statut-bug { color: #e74c3c; font-weight: 600; }
          .statut-encours { color: #f39c12; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Rapport de Tests</h1>
          <div>${session.nom}</div>
        </div>
        
        <div class="session-info">
          <div>Date: ${new Date(session.date_creation).toLocaleDateString('fr-FR')}</div>
          <div>Statut: ${session.statut}</div>
          <div>Créé par: ${session.createdByUsername || 'N/A'}</div>
        </div>

        <div class="stats">
          <div class="stat-box stat-total">Total: ${session.total_tests}</div>
          <div class="stat-box stat-ok">OK: ${session.tests_ok}</div>
          <div class="stat-box stat-bug">BUG: ${session.tests_bug}</div>
          <div class="stat-box stat-encours">En cours: ${session.tests_en_cours}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Fonction</th>
              <th>Précondition</th>
              <th>Étapes</th>
              <th>Résultat Attendu</th>
              <th>Résultat Obtenu</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            ${session.tests.map(test => `
              <tr>
                <td>${test.fonction || ''}</td>
                <td>${test.precondition || ''}</td>
                <td>${test.etapes || ''}</td>
                <td>${test.resultatAttendu || ''}</td>
                <td>${test.resultatObtenu || ''}</td>
                <td class="statut-${test.statut?.toLowerCase().replace(' ', '')}">${test.statut || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 20px; text-align: center; color: #7f8c8d; font-size: 12px;">
          Généré le ${formattedDate}
        </div>
      </body>
      </html>
    `;
  }
}
