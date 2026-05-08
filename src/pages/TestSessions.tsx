import React, { useEffect, useState, useCallback } from 'react';
import { testSessionsAPI, applicationsAPI, Application } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faFilePdf, faFileWord, faEye, faTimes, faMinus } from '@fortawesome/free-solid-svg-icons';

// Hook pour détecter la taille d'écran
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px est la limite commune pour mobile
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

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
  const isMobile = useResponsive(); // Utilisation du hook responsive
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

  const getStatusBadge = (statut: string) => ({
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
    backgroundColor: getStatusColor(statut),
    color: 'white',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px'
  });

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

  if (loading) {
    return <div style={styles.loading}>Chargement...</div>;
  }

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <div style={styles.pageHeader}>
          <div>
            <h2 style={styles.pageTitle}>Gestion des Sessions</h2>
            <p style={styles.pageSubtitle}>
              {sessions.length} session{sessions.length !== 1 ? 's' : ''} · {sessions.reduce((acc, s) => acc + (s.total_tests || 0), 0)} tests au total
            </p>
          </div>
          <button style={styles.addButton} onClick={() => setShowCreateModal(true)}>
            <FontAwesomeIcon icon={faPlus} /> Nouvelle session
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
              <button style={styles.closeDetailButton} onClick={() => setSelectedSession(null)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div style={styles.sessionDetailsContent}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Statut:</span>
                <span style={getStatusBadge(selectedSession.statut)}>{selectedSession.statut}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Application:</span>
                <span>{getAppName(selectedSession.applicationId)}</span>
              </div>
              {selectedSession.environnement && (
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Environnement:</span>
                  <span>{selectedSession.environnement}</span>
                </div>
              )}
              {selectedSession.version && (
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Version:</span>
                  <span>{selectedSession.version}</span>
                </div>
              )}
              {selectedSession.nom_document && (
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Document:</span>
                  <span>{selectedSession.nom_document}</span>
                </div>
              )}
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Total tests:</span>
                <span>{selectedSession.total_tests || 0}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Tests OK:</span>
                <span style={{ color: '#27ae60', fontWeight: 600 }}>{selectedSession.tests_ok || 0}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Tests BUG:</span>
                <span style={{ color: '#dc3545', fontWeight: 600 }}>{selectedSession.tests_bug || 0}</span>
              </div>
              {selectedSession.description && (
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Description:</span>
                  <span style={{ maxWidth: '400px' }}>{selectedSession.description}</span>
                </div>
              )}
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button 
                  style={styles.exportPdfButton}
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

        {sessions.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <FontAwesomeIcon icon={faPlus} />
            </div>
            <h3>Aucune session</h3>
            <p>Créez votre première session de test pour commencer</p>
            <button style={styles.emptyButton} onClick={() => setShowCreateModal(true)}>
              <FontAwesomeIcon icon={faPlus} /> Créer une session
            </button>
          </div>
        ) : (
          /* Affichage en fonction de la taille d'écran */
          isMobile ? (
            /* Affichage en cartes pour mobile */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {sessions.map((session) => (
              <div key={session.id} style={{
                ...styles.sessionItem,
                border: `2px solid ${getStatusColor(session.statut)}`,
                backgroundColor: '#fff',
                padding: '15px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={styles.sessionHeader}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#2c3e50' }}>
                    {session.nom}
                  </h3>
                  <span style={getStatusBadge(session.statut)}>{session.statut}</span>
                </div>
                
                <div style={{ marginBottom: '10px' }}>
                  <strong>Application:</strong> {getAppName(session.applicationId)}
                </div>
                
                {session.environnement && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Environnement:</strong> {session.environnement}
                  </div>
                )}
                
                {session.version && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Version:</strong> v{session.version}
                  </div>
                )}
                
                {session.description && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Description:</strong>
                    <div style={{ marginTop: '5px', fontSize: '13px', lineHeight: '1.4' }}>
                      {session.description}
                    </div>
                  </div>
                )}
                
                <div style={{ marginBottom: '10px' }}>
                  <strong>Statistiques:</strong>
                  <div style={{ marginTop: '5px', fontSize: '13px', lineHeight: '1.4' }}>
                    <span>Total: <strong>{session.total_tests || 0}</strong></span>
                    <span style={{ color: '#27ae60', marginLeft: '15px' }}>OK: <strong>{session.tests_ok || 0}</strong></span>
                    <span style={{ color: '#dc3545', marginLeft: '15px' }}>BUG: <strong>{session.tests_bug || 0}</strong></span>
                  </div>
                </div>
                
                <div style={{ marginBottom: '10px' }}>
                  <strong>Date de création:</strong> {new Date(session.date_creation).toLocaleDateString('fr-FR')}
                </div>
                
                <div style={styles.sessionActions}>
                  <button 
                    style={{...styles.viewButton, padding: '8px 12px', marginRight: '8px'}}
                    onClick={() => setSelectedSession(session)}
                    title="Voir détails"
                  >
                    <FontAwesomeIcon icon={faEye} />
                  </button>
                  <button 
                    style={{...styles.editButton, padding: '8px 12px', marginRight: '8px'}}
                    onClick={() => openEditModal(session)}
                    title="Modifier"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button 
                    style={{...styles.deleteButton, padding: '8px 12px'}}
                    onClick={() => handleDelete(session.id)}
                    title="Supprimer"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          ) : (
            /* Affichage normal pour desktop */
            <div style={styles.sessionsList}>
              {sessions.map((session) => (
                <div key={session.id} style={styles.sessionItem}>
                  <div style={styles.sessionMain}>
                    <div style={styles.sessionLeft}>
                      <div style={styles.sessionHeader}>
                        <h3 style={styles.sessionTitle}>{session.nom}</h3>
                        <span style={getStatusBadge(session.statut)}>{session.statut}</span>
                      </div>
                      <div style={styles.sessionMeta}>
                        <span><FontAwesomeIcon icon={faMinus} /> {getAppName(session.applicationId)}</span>
                        {session.environnement && <span><FontAwesomeIcon icon={faMinus} /> {session.environnement}</span>}
                        {session.version && <span><FontAwesomeIcon icon={faMinus} /> v{session.version}</span>}
                      </div>
                      {session.description && (
                        <p style={styles.sessionDescription}>{session.description}</p>
                      )}
                      <div style={styles.sessionStats}>
                        <span>Total: <strong>{session.total_tests || 0}</strong></span>
                        <span style={{ color: '#27ae60' }}>OK: <strong>{session.tests_ok || 0}</strong></span>
                        <span style={{ color: '#dc3545' }}>BUG: <strong>{session.tests_bug || 0}</strong></span>
                      </div>
                    </div>
                    <div style={styles.sessionActions}>
                      <button 
                        style={styles.viewButton}
                        onClick={() => setSelectedSession(session)}
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
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>

      {/* Modal création */}
      {showCreateModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <span style={styles.modalCloseButton} onClick={() => setShowCreateModal(false)}>&times;</span>
            <h3 style={styles.modalTitle}>Nouvelle session</h3>
            <p style={styles.modalSubtitle}>Créez une session pour regrouper vos cas de test.</p>
            <form onSubmit={handleCreateSession} style={styles.modalForm}>
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
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Application</label>
                  <select
                    value={sessionForm.applicationId || ''}
                    onChange={(e) => setSessionForm({ ...sessionForm, applicationId: Number(e.target.value) })}
                    style={styles.select}
                  >
                    <option value="">Sélectionner</option>
                    {applications.map((app) => (
                      <option key={app.id} value={app.id}>{app.nom}</option>
                    ))}
                  </select>
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
                <label style={styles.label}>Description</label>
                <textarea
                  value={sessionForm.description}
                  onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })}
                  style={styles.textarea}
                  placeholder="Description..."
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

      {/* Modal édition */}
      {showModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <span style={styles.modalCloseButton} onClick={() => setShowModal(false)}>&times;</span>
            <h3 style={styles.modalTitle}>Modifier la session</h3>
            <form onSubmit={handleUpdateSession} style={styles.modalForm}>
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
  main: { padding: '30px', maxWidth: '900px', margin: '0 auto', width: '100%', minHeight: 'calc(100vh - 70px)' },
  
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' },
  pageTitle: { margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '12px' },
  pageSubtitle: { margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' },

  addButton: { padding: '12px 20px', backgroundColor: 'var(--success-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' },

  success: { padding: '14px', backgroundColor: 'var(--success-color)', color: 'white', borderRadius: '8px', marginBottom: '20px' },
  error: { padding: '14px', backgroundColor: 'var(--danger-color)', color: 'white', borderRadius: '8px', marginBottom: '20px' },

  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--text-secondary)' },

  emptyState: { textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' },
  emptyIcon: { fontSize: '48px', marginBottom: '16px', opacity: 0.5, color: 'var(--text-secondary)' },
  emptyButton: { marginTop: '16px', padding: '12px 24px', backgroundColor: 'var(--success-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' },

  sessionsList: { display: 'flex', flexDirection: 'column', gap: '16px' },

  sessionItem: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid var(--border-color)',
    boxShadow: '0 2px 8px var(--shadow-color)',
    transition: 'all 0.2s ease'
  },

  sessionMain: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    flexWrap: 'wrap' as const
  },

  sessionLeft: {
    flex: 1,
    minWidth: '280px'
  },

  sessionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
    gap: '12px',
    flexWrap: 'wrap' as const
  },

  sessionTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    lineHeight: '1.3'
  },

  sessionMeta: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap' as const,
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginBottom: '12px'
  },

  sessionDescription: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginBottom: '12px',
    lineHeight: '1.5'
  },

  sessionStats: {
    display: 'flex',
    gap: '16px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    padding: '10px 14px',
    backgroundColor: 'var(--hover-bg)',
    borderRadius: '8px',
    border: '1px solid var(--border-color)'
  },

  sessionActions: {
    display: 'flex',
    gap: '8px',
    flexShrink: 0
  },

  viewButton: { padding: '8px 12px', backgroundColor: 'var(--info-color)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600 },
  editButton: { padding: '8px 12px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600 },
  deleteButton: { padding: '8px 12px', backgroundColor: 'var(--danger-color)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600 },

  // Session details panel (comme Todos)
  sessionDetails: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    border: '1px solid var(--border-color)',
    boxShadow: '0 2px 8px var(--shadow-color)'
  },

  sessionDetailsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },

  sessionDetailsTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 600,
    color: 'var(--text-primary)'
  },

  closeDetailButton: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    lineHeight: 1,
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transition: 'background-color 0.2s'
  },

  sessionDetailsContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    fontSize: '14px'
  },

  detailRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start'
  },

  detailLabel: {
    fontWeight: 600,
    color: 'var(--text-secondary)',
    minWidth: '140px',
    flexShrink: 0
  },

  exportPdfButton: {
    padding: '10px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },

  exportWordButton: {
    padding: '10px 16px',
    backgroundColor: '#17a2b8',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },

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
    padding: '24px',
    borderRadius: '16px',
    width: '95%',
    maxWidth: '500px',
    position: 'relative' as const,
    margin: '0 auto 40px auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    border: '1px solid var(--border-light)'
  },

  modalTitle: {
    margin: '0 0 4px',
    fontSize: '20px',
    fontWeight: 600,
    color: 'var(--text-primary)'
  },

  modalSubtitle: {
    margin: '0 0 20px',
    fontSize: '13px',
    color: 'var(--text-secondary)'
  },

  modalCloseButton: {
    position: 'absolute' as const,
    top: '12px',
    right: '16px',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    fontSize: '24px',
    background: 'none',
    border: 'none',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%'
  },

  modalForm: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px'
  },

  formRow: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap' as const
  },

  formGroup: {
    flex: 1,
    minWidth: '200px'
  },

  label: {
    display: 'block',
    marginBottom: '6px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    fontSize: '13px'
  },

  input: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text-primary)'
  },

  select: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text-primary)',
    cursor: 'pointer'
  },

  textarea: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text-primary)',
    resize: 'vertical' as const,
    minHeight: '80px'
  },

  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '8px'
  },

  submitButton: {
    padding: '10px 20px',
    backgroundColor: 'var(--success-color)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600
  },

  cancelButton: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 500
  }
};

export default TestSessions;
