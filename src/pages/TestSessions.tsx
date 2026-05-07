import React, { useEffect, useState, useCallback } from 'react';
import { testSessionsAPI, applicationsAPI, Application } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faFilePdf, faFileWord, faEdit, faEye } from '@fortawesome/free-solid-svg-icons';

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
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState<TestSession | null>(null);
  const [selectedSession, setSelectedSession] = useState<TestSession | null>(null);

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

  const getStatusBadge = (statut: string) => {
    const color = getStatusColor(statut);
    return {
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 600,
      backgroundColor: color,
      color: 'white',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px'
    };
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
    } finally {
      setLoading(false);
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

  const openSessionDetails = (session: TestSession) => {
    setSelectedSession(session);
  };

  const closeSessionDetails = () => {
    setSelectedSession(null);
  };

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.pageTitle}>Gestion des Sessions</h2>
            <p style={styles.pageSubtitle}>Créez et gérez vos sessions de test</p>
          </div>
          <button style={styles.newButton} onClick={() => setShowCreateModal(true)}>
            <FontAwesomeIcon icon={faEdit} /> Nouvelle session
          </button>
        </div>

        {message.text && (
          <div style={message.type === 'success' ? styles.success : styles.error}>
            {message.text}
          </div>
        )}

        {selectedSession && (
          <div style={styles.sessionDetails}>
            <div style={styles.sessionDetailsHeader}>
              <h3 style={styles.sessionDetailsTitle}>{selectedSession.nom}</h3>
              <button style={styles.closeButton} onClick={closeSessionDetails}>×</button>
            </div>
            <div style={styles.sessionDetailsContent}>
              <p><strong>Statut:</strong> <span style={getStatusBadge(selectedSession.statut)}>{selectedSession.statut}</span></p>
              <p><strong>Application:</strong> {getAppName(selectedSession.applicationId)}</p>
              {selectedSession.environnement && <p><strong>Environnement:</strong> {selectedSession.environnement}</p>}
              {selectedSession.version && <p><strong>Version:</strong> {selectedSession.version}</p>}
              {selectedSession.nom_document && <p><strong>Document:</strong> {selectedSession.nom_document}</p>}
              <p><strong>Total tests:</strong> {selectedSession.total_tests || 0}</p>
              <p><strong>Tests OK:</strong> {selectedSession.tests_ok || 0}</p>
              <p><strong>Tests BUG:</strong> {selectedSession.tests_bug || 0}</p>
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button 
                  style={styles.exportButton}
                  onClick={() => handleExportPDF(selectedSession)}
                >
                  <FontAwesomeIcon icon={faFilePdf} /> Exporter PDF
                </button>
                <button 
                  style={styles.exportWordButton}
                  onClick={() => handleExportWord(selectedSession)}
                >
                  <FontAwesomeIcon icon={faFileWord} /> Exporter Word
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={styles.tableSection}>
          <h3 style={styles.sectionTitle}>Liste des sessions</h3>
          {loading ? (
            <p>Chargement...</p>
          ) : (
            <div style={{ overflowX: 'auto', margin: '0 -12px', padding: '0 12px' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableTh}>ID</th>
                    <th style={styles.tableTh}>Nom</th>
                    <th style={styles.tableTh}>Application</th>
                    <th style={styles.tableTh}>Environnement</th>
                    <th style={styles.tableTh}>Version</th>
                    <th style={styles.tableTh}>Statut</th>
                    <th style={styles.tableTh}>Tests</th>
                    <th style={styles.tableTh}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id} style={styles.tableTrHover}>
                      <td style={styles.tableTd}>{session.id}</td>
                      <td style={styles.tableTd}>{session.nom}</td>
                      <td style={styles.tableTd}>{getAppName(session.applicationId)}</td>
                      <td style={styles.tableTd}>{session.environnement || '-'}</td>
                      <td style={styles.tableTd}>{session.version || '-'}</td>
                      <td style={styles.tableTd}>
                        <span style={getStatusBadge(session.statut)}>
                          {session.statut}
                        </span>
                      </td>
                      <td style={styles.tableTd}>
                        {session.total_tests || 0} / OK: {session.tests_ok || 0} / BUG: {session.tests_bug || 0}
                      </td>
                      <td style={styles.tableTd}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          <button 
                            style={styles.viewButton}
                            onClick={() => openSessionDetails(session)}
                            title="Voir détails"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                          <button 
                            style={styles.editButton}
                            onClick={() => openEditModal(session)}
                            title="Modifier"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button 
                            style={styles.deleteButton}
                            onClick={() => handleDelete(session.id)}
                            title="Supprimer"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
            <form onSubmit={handleCreateSession} style={styles.modalForm}>
              <div style={styles.formRow}>
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
              </div>
              <div style={styles.formRow}>
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
              </div>
              <div style={styles.formGroupFull}>
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
                <button type="button" style={styles.cancelButton} onClick={() => setShowCreateModal(false)}>Annuler</button>
                <button type="submit" style={styles.submitButton}>Créer</button>
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
            <form onSubmit={handleUpdateSession} style={styles.modalForm}>
              <div style={styles.formGroupFull}>
                <label style={styles.label}>Nom *</label>
                <input
                  type="text"
                  value={editFormData.nom}
                  onChange={(e) => setEditFormData({ ...editFormData, nom: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formRow}>
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
              </div>
              <div style={styles.formRow}>
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
              </div>
              <div style={styles.formGroupFull}>
                <label style={styles.label}>Nom du document</label>
                <input
                  type="text"
                  value={editFormData.nom_document}
                  onChange={(e) => setEditFormData({ ...editFormData, nom_document: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroupFull}>
                <label style={styles.label}>Description</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  style={styles.textarea}
                  rows={3}
                />
              </div>
              <div style={styles.formActions}>
                <button type="button" style={styles.cancelButton} onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" style={styles.submitButton}>Enregistrer</button>
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
  main: { padding: '30px', maxWidth: '1400px', margin: '0 auto', minHeight: 'calc(100vh - 70px)' },
  
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' as const, gap: '16px' },
  pageTitle: { margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '12px' },
  pageSubtitle: { margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' },
  
  newButton: { padding: '10px 20px', backgroundColor: 'var(--success-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease' },
  
  success: { padding: '14px', backgroundColor: 'var(--success-color)', color: 'white', borderRadius: 'var(--radius-md)', marginBottom: '20px' },
  error: { padding: '14px', backgroundColor: 'var(--danger-color)', color: 'white', borderRadius: 'var(--radius-md)', marginBottom: '20px' },
  
  tableSection: { backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px var(--shadow-color)' },
  sectionTitle: { margin: '0 0 20px', fontSize: '18px' },
  
  table: { 
    width: '100%', 
    borderCollapse: 'collapse' as const, 
    borderRadius: 'var(--radius-md)', 
    overflow: 'hidden',
    backgroundColor: 'var(--bg-card)'
  },
  tableTh: { 
    padding: '12px', 
    textAlign: 'left' as const, 
    backgroundColor: 'var(--hover-bg)', 
    fontWeight: 600, 
    color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border-color)',
    fontSize: '13px'
  },
  tableTd: { 
    padding: '12px', 
    borderBottom: '1px solid var(--border-color)', 
    color: 'var(--text-primary)',
    fontSize: '13px'
  },
  tableTrHover: { 
    backgroundColor: 'var(--hover-bg)',
    transition: 'background-color 0.2s ease'
  },
  
  viewButton: { padding: '8px 12px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' },
  editButton: { padding: '8px 12px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  deleteButton: { padding: '8px 12px', backgroundColor: '#ff6b6b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  exportButton: { padding: '8px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  exportWordButton: { padding: '8px 12px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },

  // Session details panel
  sessionDetails: { 
    backgroundColor: 'var(--bg-card)', 
    borderRadius: 'var(--radius-lg)', 
    padding: '24px', 
    marginBottom: '24px', 
    border: '1px solid var(--border-color)', 
    boxShadow: '0 2px 8px var(--shadow-color)' 
  },
  sessionDetailsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  sessionDetailsTitle: { margin: 0, fontSize: '18px', color: 'var(--text-primary)' },
  closeButton: { 
    background: 'none', 
    border: 'none', 
    fontSize: '28px', 
    cursor: 'pointer', 
    color: 'var(--text-muted)',
    lineHeight: 1,
    padding: 0,
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sessionDetailsContent: { display: 'flex', flexDirection: 'column' as const, gap: '8px', fontSize: '14px' },

  // Modal styles
  modal: { 
    position: 'fixed' as const, 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    width: '100%', 
    height: '100%', 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'flex-start', 
    zIndex: 1000,
    paddingTop: '40px',
    overflowY: 'auto' as const,
    backdropFilter: 'blur(4px)'
  },
  modalContent: { 
    backgroundColor: 'var(--bg-card)', 
    padding: '20px', 
    borderRadius: '16px', 
    width: '95%', 
    maxWidth: '500px', 
    position: 'relative' as const,
    margin: '0 auto 40px auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    border: '1px solid var(--border-light)'
  },
  modalHeader: { marginBottom: '20px' },
  modalSubtitle: { fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' },
  close: { position: 'absolute' as const, top: '15px', right: '20px', fontSize: '24px', cursor: 'pointer', color: 'var(--text-muted)' },

  modalForm: { display: 'flex', flexDirection: 'column' as const, gap: '20px', padding: '8px 0' },
  formRow: { display: 'flex', gap: '16px', flexWrap: 'wrap' as const },
  formGroup: { marginBottom: '16px', flex: 1 },
  formGroupFull: { marginBottom: '16px', width: '100%' },
  label: { display: 'block', marginBottom: '6px', fontWeight: 500, color: 'var(--text-secondary)', fontSize: '13px' },
  input: { width: '100%', padding: '12px 14px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '14px', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' },
  select: { width: '100%', padding: '12px 14px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '14px', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' },
  textarea: { width: '100%', padding: '12px 14px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '14px', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', resize: 'vertical', minHeight: '100px' },
  formActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '20px', flexWrap: 'wrap' as const },
  
  submitButton: { padding: '12px 24px', backgroundColor: 'var(--success-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' },
  cancelButton: { padding: '12px 24px', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '14px' },
};

export default TestSessions;
