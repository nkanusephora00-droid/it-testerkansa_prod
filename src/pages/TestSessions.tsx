import React, { useEffect, useState, useCallback } from 'react';
import { testSessionsAPI, applicationsAPI, Application } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faFilePdf, faFileWord, faPlus, faEdit, faCheck, faTimes, faFile, faUser } from '@fortawesome/free-solid-svg-icons';

interface TestSession {
  id: number;
  nom: string;
  description?: string;
  applicationId?: number;
  applicationNom?: string;
  environnement?: string;
  version?: string;
  nom_document?: string;
  date_creation: string;
  statut: string;
  created_by?: number;
  createdByUsername?: string;
  total_tests?: number;
  tests_ok?: number;
  tests_bug?: number;
}

const TestSessions: React.FC = () => {
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState<TestSession | null>(null);
  const [sessionForm, setSessionForm] = useState({ 
    nom: '', 
    description: '', 
    nom_document: '',
    applicationId: 0,
    statut: 'En cours' 
  });
  const [editFormData, setEditFormData] = useState({ 
    nom: '', 
    description: '', 
    applicationId: 0,
    environnement: '', 
    version: '',
    nom_document: '',
    statut: 'En cours'
  });

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'Terminée':
        return '#28a745';
      case 'Bloquée':
        return '#dc3545';
      case 'En cours':
      default:
        return '#ffc107';
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const [sessionsData, appsData] = await Promise.all([
        testSessionsAPI.getAll(),
        applicationsAPI.getAll()
      ]);
      const sessions: any = sessionsData;
      const apps: any = appsData;
      const sessionsList = Array.isArray(sessions) ? sessions : (sessions?.content || []);
      setSessions(sessionsList);
      setApplications(Array.isArray(apps) ? apps : (apps?.content || []));
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur de chargement' });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const sessionData = {
        nom: sessionForm.nom,
        description: sessionForm.description,
        applicationId: sessionForm.applicationId || undefined,
        nom_document: sessionForm.nom_document || undefined,
        statut: sessionForm.statut
      };
      await testSessionsAPI.create(sessionData);
      setMessage({ type: 'success', text: 'Session créée avec succès!' });
      setShowCreateModal(false);
      setSessionForm({ nom: '', description: '', nom_document: '', applicationId: 0, statut: 'En cours' });
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Erreur lors de la création' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette session?')) return;
    try {
      await testSessionsAPI.delete(id);
      setMessage({ type: 'success', text: 'Session supprimée!' });
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Erreur lors de la suppression' });
    }
  };

  const openEditModal = (session: TestSession) => {
    setEditingSession(session);
    setEditFormData({
      nom: session.nom,
      description: session.description || '',
      applicationId: session.applicationId || 0,
      environnement: session.environnement || '',
      version: session.version || '',
      nom_document: session.nom_document || '',
      statut: session.statut || 'En cours'
    });
    setShowModal(true);
  };

  const handleUpdateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    try {
      await testSessionsAPI.update(editingSession.id, editFormData);
      setMessage({ type: 'success', text: 'Session mise à jour!' });
      setShowModal(false);
      setEditingSession(null);
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Erreur lors de la mise à jour' });
    }
  };

  const getAppName = (appId?: number) => {
    if (!appId) return 'Aucune';
    const app = applications.find(a => a.id === appId);
    return app ? app.nom : 'Application inconnue';
  };

  const handleExportWord = async (session: TestSession) => {
    try {
      const wordContent = `
        RAPPORT DE SESSION DE TEST - ${session.nom}
        ==========================================
        
        INFORMATIONS GÉNÉRALES
        ------------------------
        Nom de la session: ${session.nom}
        Application: ${getAppName(session.applicationId)}
        ${session.environnement ? `Environnement: ${session.environnement}` : ''}
        ${session.version ? `Version: ${session.version}` : ''}
        Statut: ${session.statut}
        Date de création: ${new Date(session.date_creation).toLocaleDateString('fr-FR')}
        
        DESCRIPTION
        -----------
        ${session.description || 'Aucune description disponible'}
        
        PROGRESSION DES TESTS
        --------------------
        ${session.total_tests ? `Tests complétés: ${session.tests_ok || 0} / ${session.total_tests}` : 'Aucun test associé'}
        ${session.total_tests ? `Taux de réussite: ${Math.round((session.tests_ok || 0) * 100 / session.total_tests)}%` : ''}
        
        STATUT
        ------
        Ce rapport a été généré automatiquement le ${new Date().toLocaleDateString('fr-FR')}
      `;

      const blob = new Blob([wordContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Rapport_Session_${session.nom.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setMessage({ type: 'success', text: 'Document Word généré avec succès!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors de la génération du document Word' });
    }
  };

  const handleExportPDF = (session: TestSession) => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${session.applicationNom || session.nom}</title>
        <style>
          @page { size: A4 landscape; margin: 15mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #333; font-size: 14px; line-height: 1.4; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #2c3e50; padding-bottom: 12px; }
          .header h1 { font-size: 22px; color: #2c3e50; margin-bottom: 8px; }
          .session-name { font-size: 14px; color: #7f8c8d; margin-top: 4px; font-style: italic; }
          .session-info { display: flex; justify-content: center; gap: 25px; margin: 12px 0; flex-wrap: wrap; }
          .info-item { text-align: center; }
          .info-label { font-size: 10px; color: #7f8c8d; text-transform: uppercase; font-weight: 600; }
          .info-value { font-size: 13px; font-weight: 600; color: #2c3e50; }
          .stats { display: flex; justify-content: center; gap: 12px; margin-bottom: 15px; flex-wrap: wrap; }
          .stat-box { padding: 8px 15px; border-radius: 6px; text-align: center; }
          .stat-total { background: #3498db; color: white; }
          .stat-ok { background: #27ae60; color: white; }
          .stat-bug { background: #e74c3c; color: white; }
          .stat-en-cours { background: #f39c12; color: white; }
          .footer { margin-top: 15px; text-align: center; color: #7f8c8d; font-size: 10px; border-top: 1px solid #ddd; padding-top: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${session.applicationNom || session.nom}</h1>
          ${session.nom ? `<div class="session-name">Session: ${session.nom}</div>` : ''}
          <div class="session-info">
            <div class="info-item"><div class="info-label">Date</div><div class="info-value">${new Date(session.date_creation).toLocaleDateString('fr-FR')}</div></div>
            ${session.environnement ? `<div class="info-item"><div class="info-label">Environnement</div><div class="info-value">${session.environnement}</div></div>` : ''}
            ${session.version ? `<div class="info-item"><div class="info-label">Version</div><div class="info-value">${session.version}</div></div>` : ''}
            <div class="info-item"><div class="info-label">Statut</div><div class="info-value">${session.statut}</div></div>
          </div>
        </div>
        <div class="stats">
          <div class="stat-box stat-total"><strong>${session.total_tests || 0}</strong><br/>Total</div>
          <div class="stat-box stat-ok"><strong>${session.tests_ok || 0}</strong><br/>OK</div>
          <div class="stat-box stat-bug"><strong>${session.tests_bug || 0}</strong><br/>BUG</div>
        </div>
        ${session.description ? `<div style="margin: 15px 0;"><strong>Description:</strong> ${session.description}</div>` : ''}
        <div class="footer">IT Access Manager - Document de test</div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => printWindow.print();
    }
  };

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <div style={styles.sessionsHeader}>
          <div>
            <h2 style={styles.pageTitle}>Gestion des Sessions de Test</h2>
            <p style={styles.pageSubtitle}>Créez et gérez vos sessions de test. Exportez les rapports PDF et Word.</p>
          </div>
          <button style={styles.newSessionButton} onClick={() => setShowCreateModal(true)}>
            <FontAwesomeIcon icon={faPlus} /> Nouvelle session
          </button>
        </div>

        {message.text && (
          <div style={message.type === 'success' ? styles.success : styles.error}>
            <FontAwesomeIcon icon={message.type === 'success' ? faCheck : faTimes} style={{ marginRight: '8px' }} />
            {message.text}
          </div>
        )}

        <div style={window.innerWidth <= 768 ? styles.sessionsGrid : styles.sessionsGridDesktop}>
          {sessions.map((session) => (
            <div key={session.id} style={styles.sessionCard}>
              <div style={styles.sessionHeader}>
                <h3 style={styles.sessionTitle}>{session.nom}</h3>
                <span style={{...styles.statusBadge, backgroundColor: getStatusColor(session.statut)}}>
                  {session.statut}
                </span>
              </div>
              
              {session.createdByUsername && (
                <p style={styles.sessionOwner}><FontAwesomeIcon icon={faUser} /> Créé par: {session.createdByUsername}</p>
              )}
              
              {session.description && (
                <p style={styles.sessionDesc}>{session.description}</p>
              )}
              
              {session.nom_document && (
                <p style={styles.sessionInfo}><FontAwesomeIcon icon={faFile} /> {session.nom_document}</p>
              )}
              
              <div style={styles.sessionStats}>
                <span><strong>Total:</strong> {session.total_tests || 0}</span>
                <span style={styles.statOk}><FontAwesomeIcon icon={faCheck} /> {session.tests_ok || 0}</span>
                <span style={styles.statBug}><FontAwesomeIcon icon={faTimes} /> {session.tests_bug || 0}</span>
              </div>

              <div style={styles.sessionMeta}>
                <span><strong>App:</strong> {getAppName(session.applicationId)}</span>
                {session.environnement && <span><strong>Env:</strong> {session.environnement}</span>}
              </div>

              <div style={styles.sessionActions}>
                <button 
                  style={styles.exportButton}
                  onClick={() => handleExportPDF(session)}
                  title="Exporter en PDF"
                >
                  <FontAwesomeIcon icon={faFilePdf} /> PDF
                </button>
                <button 
                  style={styles.exportButton}
                  onClick={() => handleExportWord(session)}
                  title="Exporter en Word"
                >
                  <FontAwesomeIcon icon={faFileWord} /> Word
                </button>
                <button 
                  style={styles.editButton}
                  onClick={() => openEditModal(session)} 
                  title="Modifier"
                >
                  <FontAwesomeIcon icon={faEdit} />
                </button>
                <button 
                  style={{...styles.deleteButton, padding: '8px 12px', backgroundColor: 'transparent', color: '#ff6b6b', border: '1px solid #ff6b6b'}}
                  onClick={() => handleDelete(session.id)} 
                  title="Supprimer"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {showCreateModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <span style={styles.close} onClick={() => setShowCreateModal(false)}>&times;</span>
            <div style={styles.modalHeader}>
              <h3 style={styles.sectionTitle}>Nouvelle session</h3>
              <p style={styles.modalSubtitle}>Créez une session pour regrouper vos cas de test.</p>
            </div>
            <form onSubmit={handleCreateSession} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nom *</label>
                <input
                  type="text"
                  value={sessionForm.nom}
                  onChange={(e) => setSessionForm({ ...sessionForm, nom: e.target.value })}
                  style={styles.input}
                  required
                  placeholder="Nom de la session"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Application</label>
                <select
                  value={sessionForm.applicationId || ''}
                  onChange={(e) => setSessionForm({ ...sessionForm, applicationId: Number(e.target.value) })}
                  style={styles.select}
                >
                  <option value="">Sélectionner une application</option>
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>{app.nom}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nom du document</label>
                <input
                  type="text"
                  value={sessionForm.nom_document}
                  onChange={(e) => setSessionForm({ ...sessionForm, nom_document: e.target.value })}
                  style={styles.input}
                  placeholder="Ex: Plan de tests v1.0"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Statut</label>
                <select
                  value={sessionForm.statut}
                  onChange={(e) => setSessionForm({ ...sessionForm, statut: e.target.value })}
                  style={styles.select}
                >
                  <option value="En cours">En cours</option>
                  <option value="Terminée">Terminée</option>
                  <option value="Bloquée">Bloquée</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  value={sessionForm.description}
                  onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })}
                  style={styles.textarea}
                  placeholder="Description de la session..."
                  rows={3}
                />
              </div>
              <div style={styles.formActions}>
                <button type="button" style={styles.secondaryButton} onClick={() => setShowCreateModal(false)}>Annuler</button>
                <button type="submit" style={styles.primaryButton}>Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <span style={styles.close} onClick={() => setShowModal(false)}>&times;</span>
            <div style={styles.modalHeader}>
              <h3 style={styles.sectionTitle}>Modifier la session</h3>
            </div>
            <form onSubmit={handleUpdateSession} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nom *</label>
                <input
                  type="text"
                  value={editFormData.nom}
                  onChange={(e) => setEditFormData({ ...editFormData, nom: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Application</label>
                <select
                  value={editFormData.applicationId || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, applicationId: Number(e.target.value) })}
                  style={styles.select}
                >
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>{app.nom}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Environnement</label>
                <input
                  type="text"
                  value={editFormData.environnement}
                  onChange={(e) => setEditFormData({ ...editFormData, environnement: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Version</label>
                <input
                  type="text"
                  value={editFormData.version}
                  onChange={(e) => setEditFormData({ ...editFormData, version: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nom du document</label>
                <input
                  type="text"
                  value={editFormData.nom_document}
                  onChange={(e) => setEditFormData({ ...editFormData, nom_document: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Statut</label>
                <select
                  value={editFormData.statut}
                  onChange={(e) => setEditFormData({ ...editFormData, statut: e.target.value })}
                  style={styles.select}
                >
                  <option value="En cours">En cours</option>
                  <option value="Terminée">Terminée</option>
                  <option value="Bloquée">Bloquée</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  style={styles.textarea}
                  rows={3}
                />
              </div>
              <div style={styles.formActions}>
                <button type="button" style={styles.secondaryButton} onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" style={styles.primaryButton}>Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { backgroundColor: 'var(--bg-primary)', minHeight: '100vh' },
  main: { padding: '20px', maxWidth: '1400px', margin: '0 auto', minHeight: 'calc(100vh - 70px)' },
  pageTitle: { fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' },
  pageSubtitle: { fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', fontWeight: '400' },
  sessionsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' as const, gap: '12px' },
  newSessionButton: { padding: '12px 24px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' },
  
  success: { padding: '14px', backgroundColor: 'var(--success-color)', color: 'white', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' },
  error: { padding: '14px', backgroundColor: 'var(--danger-color)', color: 'white', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' },

  sessionsGrid: { 
    display: 'grid', 
    gridTemplateColumns: '1fr', 
    gap: '16px', 
    padding: '0 12px'
  },
  sessionsGridDesktop: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
    padding: '0 12px'
  },

  sessionCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: '12px', 
    padding: '24px', 
    border: '1px solid #e1e5e9', 
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
    transition: 'all 0.3s ease',
    minHeight: '280px',
    display: 'flex',
    flexDirection: 'column'
  },
  sessionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '8px' },
  sessionTitle: { margin: 0, color: '#1a1a1a', fontSize: '18px', fontWeight: '700', flex: 1, lineHeight: '1.3' },
  statusBadge: { padding: '6px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', color: 'white', textTransform: 'uppercase', letterSpacing: '0.5px' },
  sessionOwner: { color: '#6b7280', fontSize: '13px', marginBottom: '8px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' },
  
  sessionDesc: { color: '#6b7280', fontSize: '14px', marginBottom: '16px', lineHeight: '1.5', minHeight: '40px', flex: 1 },
  sessionInfo: { fontSize: '13px', color: '#6b7280', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' },
  
  sessionStats: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    gap: '8px', 
    marginBottom: '16px', 
    fontSize: '13px', 
    padding: '12px', 
    backgroundColor: '#f8fafc', 
    borderRadius: '8px', 
    border: '1px solid #e2e8f0' 
  },
  statOk: { color: '#27ae60', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' } ,
  statBug: { color: '#dc3545', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' } ,
  
  sessionMeta: { display: 'flex', gap: '16px', fontSize: '12px', color: '#6b7280', marginBottom: '16px' },
  
  sessionActions: { 
    display: 'flex', 
    gap: '8px', 
    marginTop: 'auto',
    flexWrap: 'wrap' as const
  },

  exportButton: { 
    padding: '10px 16px', 
    backgroundColor: '#ef4444', 
    color: 'white', 
    border: 'none', 
    borderRadius: '6px', 
    cursor: 'pointer', 
    fontWeight: '600', 
    fontSize: '12px',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flex: 1
  },

  editButton: { 
    padding: '8px 16px', 
    backgroundColor: '#3b82f6', 
    color: 'white', 
    border: 'none', 
    borderRadius: '6px', 
    cursor: 'pointer', 
    fontWeight: '600', 
    fontSize: '12px',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flex: 1
  },

  deleteButton: { 
    padding: '8px 16px', 
    backgroundColor: '#dc3545', 
    color: 'white', 
    border: 'none', 
    borderRadius: '6px', 
    cursor: 'pointer', 
    fontWeight: '600', 
    fontSize: '12px',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flex: 1
  },

  // Modal styles
  modal: { 
    position: 'fixed' as const, 
    top: 0, 
    left: 0, 
    width: '100%', 
    height: '100%', 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    zIndex: 9999,
    overflowY: 'auto' as const
  },
  modalContent: { 
    backgroundColor: 'var(--bg-card)', 
    padding: '30px', 
    borderRadius: '16px', 
    width: '95%', 
    maxWidth: '500px', 
    position: 'relative' as const,
    margin: '40px auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    border: '1px solid var(--border-light)'
  },
  modalHeader: { marginBottom: '20px' },
  modalSubtitle: { fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' },
  close: { position: 'absolute' as const, top: '15px', right: '20px', fontSize: '28px', cursor: 'pointer', color: 'var(--text-muted)' },
  
  form: { display: 'flex', flexDirection: 'column' as const, gap: '16px' },
  formGroup: { display: 'flex', flexDirection: 'column' as const, gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' },
  input: { 
    padding: '12px 14px', 
    border: '1px solid var(--border-color)', 
    borderRadius: '8px',
    fontSize: '14px', 
    backgroundColor: 'var(--input-bg)', 
    color: 'var(--text-primary)'
  },
  select: { 
    padding: '12px 14px', 
    border: '1px solid var(--border-color)', 
    borderRadius: '8px',
    fontSize: '14px', 
    backgroundColor: 'var(--input-bg)', 
    color: 'var(--text-primary)',
    cursor: 'pointer'
  },
  textarea: { 
    padding: '12px 14px', 
    border: '1px solid var(--border-color)', 
    borderRadius: '8px',
    fontSize: '14px', 
    backgroundColor: 'var(--input-bg)', 
    color: 'var(--text-primary)',
    resize: 'vertical' as const,
    minHeight: '80px'
  },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' },
  primaryButton: { 
    padding: '10px 20px', 
    backgroundColor: 'var(--primary-color)', 
    color: 'white', 
    border: 'none', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontWeight: '600' 
  },
  secondaryButton: { 
    padding: '10px 20px', 
    backgroundColor: 'transparent', 
    color: 'var(--text-secondary)', 
    border: '1px solid var(--border-color)', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontWeight: '500' 
  }
};

export default TestSessions;
