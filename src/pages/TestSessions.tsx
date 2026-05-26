import React, { useEffect, useState, useCallback } from 'react';
import { testSessionsAPI, applicationsAPI, Application } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faFilePdf, faFileWord, faEye, faTimes, faUser } from '@fortawesome/free-solid-svg-icons';
import '../styles/pages/TestSessions.css';

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
  role?: string;
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
    applicationId: 0,
    environnement: '',
    version: '',
    nom_document: '',
    statut: 'En cours',
    role: ''
  });

  const [editFormData, setEditFormData] = useState({ 
    nom: '', 
    description: '', 
    applicationId: 0,
    environnement: '', 
    version: '',
    nom_document: '',
    statut: 'En cours',
    role: ''
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
        environnement: sessionForm.environnement || undefined,
        version: sessionForm.version || undefined,
        nom_document: sessionForm.nom_document || undefined,
        statut: sessionForm.statut,
        role: sessionForm.role || undefined
      };
      await testSessionsAPI.create(sessionData);
      setMessage({ type: 'success', text: 'Session créée avec succès!' });
      setShowCreateModal(false);
      setSessionForm({ nom: '', description: '', applicationId: 0, environnement: '', version: '', nom_document: '', statut: 'En cours', role: '' });
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
    console.log('Ouverture du formulaire d\'édition pour la session:', session);
    setEditingSession(session);
    
    const formData = {
      nom: session.nom,
      description: session.description || '',
      applicationId: session.applicationId || 0,
      environnement: session.environnement || '',
      version: session.version || '',
      nom_document: session.nom_document || '',
      statut: session.statut || 'En cours',
      role: session.role || ''
    };
    
    console.log('Données du formulaire d\'édition:', formData);
    setEditFormData(formData);
    setShowModal(true);
  };

  const handleUpdateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    
    console.log('Tentative de mise à jour de la session:', editingSession.id);
    console.log('Données envoyées:', editFormData);
    
    try {
      const response = await testSessionsAPI.update(editingSession.id, editFormData);
      console.log('Mise à jour réussie:', response);
      setMessage({ type: 'success', text: 'Session mise à jour!' });
      setShowModal(false);
      setEditingSession(null);
      fetchData();
    } catch (err: unknown) {
      console.error('Erreur lors de la mise à jour:', err);
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
    return <div className="test-sessions-loading">Chargement...</div>;
  }

  return (
    <div className="test-sessions-container">
      <main className="test-sessions-main">
        <div className="test-sessions-header">
          <div className="test-sessions-header-left">
            <div>
              <h2 className="test-sessions-page-title">Gestion des Sessions</h2>
              <p className="test-sessions-page-subtitle">
                {sessions.length} session{sessions.length !== 1 ? 's' : ''} · {sessions.reduce((acc, s) => acc + (s.total_tests || 0), 0)} tests au total
              </p>
            </div>
          </div>
          <button
            className="test-sessions-new-button"
            onClick={() => setShowCreateModal(true)}
            title="Créer une nouvelle session"
          >
            <FontAwesomeIcon icon={faPlus} /> Nouvelle session
          </button>
        </div>

        {message.text && (
          <div className={message.type === 'success' ? 'test-sessions-success' : 'test-sessions-error'}>
            {message.text}
          </div>
        )}

        {selectedSession && (
          <div className="test-sessions-session-details">
            <div className="test-sessions-session-details-header">
              <h3 className="test-sessions-session-details-title">{selectedSession.nom}</h3>
              <button className="test-sessions-close-detail-button" onClick={() => setSelectedSession(null)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="test-sessions-session-details-content">
              <div className="test-sessions-detail-row">
                <span className="test-sessions-detail-label">Statut:</span>
                <span style={getStatusBadge(selectedSession.statut)}>{selectedSession.statut}</span>
              </div>
              <div className="test-sessions-detail-row">
                <span className="test-sessions-detail-label">Application:</span>
                <span>{getAppName(selectedSession.applicationId)}</span>
              </div>
              {selectedSession.environnement && (
                <div className="test-sessions-detail-row">
                  <span className="test-sessions-detail-label">Environnement:</span>
                  <span>{selectedSession.environnement}</span>
                </div>
              )}
              {selectedSession.version && (
                <div className="test-sessions-detail-row">
                  <span className="test-sessions-detail-label">Version:</span>
                  <span>{selectedSession.version}</span>
                </div>
              )}
              {selectedSession.nom_document && (
                <div className="test-sessions-detail-row">
                  <span className="test-sessions-detail-label">Document:</span>
                  <span>{selectedSession.nom_document}</span>
                </div>
              )}
              <div className="test-sessions-detail-row">
                <span className="test-sessions-detail-label">Total tests:</span>
                <span>{selectedSession.total_tests || 0}</span>
              </div>
              <div className="test-sessions-detail-row">
                <span className="test-sessions-detail-label">Tests OK:</span>
                <span style={{ color: '#27ae60', fontWeight: 600 }}>{selectedSession.tests_ok || 0}</span>
              </div>
              <div className="test-sessions-detail-row">
                <span className="test-sessions-detail-label">Tests BUG:</span>
                <span style={{ color: '#dc3545', fontWeight: 600 }}>{selectedSession.tests_bug || 0}</span>
              </div>
              {selectedSession.description && (
                <div className="test-sessions-detail-row">
                  <span className="test-sessions-detail-label">Description:</span>
                  <span style={{ maxWidth: '400px' }}>{selectedSession.description}</span>
                </div>
              )}
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button
                  className="test-sessions-export-pdf-button"
                  onClick={() => handleExportPDF(selectedSession)}
                >
                  <FontAwesomeIcon icon={faFilePdf} /> Exporter PDF
                </button>
                <button
                  className="test-sessions-export-word-button"
                  onClick={() => handleExportWord(selectedSession)}
                >
                  <FontAwesomeIcon icon={faFileWord} /> Exporter Word
                </button>
              </div>
            </div>
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="test-sessions-empty-state">
            <div className="test-sessions-empty-icon">
              <FontAwesomeIcon icon={faPlus} />
            </div>
            <h3>Aucune session</h3>
            <p>Créez votre première session de test pour commencer</p>
            <button className="test-sessions-empty-button" onClick={() => setShowCreateModal(true)}>
              <FontAwesomeIcon icon={faPlus} /> Créer une session
            </button>
          </div>
        ) : (
          <div className="sessions-grid test-sessions-grid">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="test-sessions-card"
                style={{
                  borderColor: getStatusColor(session.statut),
                  borderWidth: '2px',
                  borderStyle: 'solid'
                }}
              >
                <div className="test-sessions-card-header">
                  <h3 className="test-sessions-card-title">{session.nom}</h3>
                  <span className="test-sessions-status-badge" style={{ backgroundColor: getStatusColor(session.statut) }}>
                    {session.statut}
                  </span>
                </div>
                 {session.createdByUsername && (
                   <p className="test-sessions-card-owner">
                     <FontAwesomeIcon icon={faUser} /> Créé par: {session.createdByUsername}
                   </p>
                 )}
                 {session.role && (
                   <p className="test-sessions-card-meta" style={{ marginBottom: '8px' }}>
                     <strong>Rôle:</strong> {session.role}
                   </p>
                 )}
                 {session.description && (
                  <p className="test-sessions-card-meta" style={{ marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>{session.description}</p>
                )}
                <div className="test-sessions-card-meta">
                  <span><i className="fas fa-mobile-alt"></i> {getAppName(session.applicationId)}</span>
                  {session.environnement && <span><i className="fas fa-server"></i> {session.environnement}</span>}
                  {session.version && <span><i className="fas fa-code-branch"></i> v{session.version}</span>}
                </div>
                <div className="test-sessions-card-stats">
                  <span>Total: <strong>{session.total_tests || 0}</strong></span>
                  <span style={{ color: '#27ae60' }}>OK: <strong>{session.tests_ok || 0}</strong></span>
                  <span style={{ color: '#dc3545' }}>BUG: <strong>{session.tests_bug || 0}</strong></span>
                </div>
                <div className="test-sessions-card-actions">
                  <button
                    className="test-sessions-view-button"
                    onClick={() => setSelectedSession(session)}
                    title="Voir détails"
                  >
                    <FontAwesomeIcon icon={faEye} /> Détails
                  </button>
                  <button
                    className="test-sessions-edit-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(session);
                    }}
                    title="Modifier"
                  >
                    <FontAwesomeIcon icon={faEdit} /> Modifier
                  </button>
                  <button
                    className="test-sessions-delete-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(session.id);
                    }}
                    title="Supprimer"
                  >
                    <FontAwesomeIcon icon={faTrash} /> Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal création */}
      {showCreateModal && (
        <div className="test-sessions-modal">
          <div className="test-sessions-modal-content">
            <span className="test-sessions-modal-close-button" onClick={() => setShowCreateModal(false)}>&times;</span>
            <h3 className="test-sessions-modal-title">Nouvelle session</h3>
            <p className="test-sessions-modal-subtitle">Créez une session pour regrouper vos cas de test.</p>
            <form onSubmit={handleCreateSession} className="test-sessions-modal-form">
              <div className="test-sessions-form-group">
                <label className="test-sessions-label">Nom *</label>
                <input
                  type="text"
                  value={sessionForm.nom}
                  onChange={(e) => setSessionForm({ ...sessionForm, nom: e.target.value })}
                  className="test-sessions-input"
                  required
                  placeholder="Nom de la session"
                />
              </div>
              <div className="test-sessions-form-row">
                <div className="test-sessions-form-group">
                  <label className="test-sessions-label">Application</label>
                  <select
                    value={sessionForm.applicationId || ''}
                    onChange={(e) => setSessionForm({ ...sessionForm, applicationId: Number(e.target.value) })}
                    className="test-sessions-select"
                  >
                    <option value="">Sélectionner</option>
                    {applications.map((app) => (
                      <option key={app.id} value={app.id}>{app.nom}</option>
                    ))}
                  </select>
                </div>
                <div className="test-sessions-form-group">
                  <label className="test-sessions-label">Statut</label>
                  <select
                    value={sessionForm.statut}
                    onChange={(e) => setSessionForm({ ...sessionForm, statut: e.target.value })}
                    className="test-sessions-select"
                  >
                    <option value="En cours">En cours</option>
                    <option value="Terminée">Terminée</option>
                    <option value="Bloquée">Bloquée</option>
                  </select>
                </div>
              </div>
               <div className="test-sessions-form-row">
                 <div className="test-sessions-form-group">
                   <label className="test-sessions-label">Environnement</label>
                   <input
                     type="text"
                     value={sessionForm.environnement}
                     onChange={(e) => setSessionForm({ ...sessionForm, environnement: e.target.value })}
                     className="test-sessions-input"
                     placeholder="Ex: Production"
                   />
                 </div>
                 <div className="test-sessions-form-group">
                   <label className="test-sessions-label">Version</label>
                   <input
                     type="text"
                     value={sessionForm.version}
                     onChange={(e) => setSessionForm({ ...sessionForm, version: e.target.value })}
                     className="test-sessions-input"
                     placeholder="Ex: 1.0.0"
                   />
                 </div>
               </div>
               <div className="test-sessions-form-group">
                 <label className="test-sessions-label">Rôle</label>
                 <input
                   type="text"
                   value={sessionForm.role}
                   onChange={(e) => setSessionForm({ ...sessionForm, role: e.target.value })}
                   className="test-sessions-input"
                   placeholder="Ex: Admin, Testeur, etc."
                 />
               </div>
               <div className="test-sessions-form-group">
                 <label className="test-sessions-label">Nom du document</label>
                 <input
                   type="text"
                   value={sessionForm.nom_document}
                   onChange={(e) => setSessionForm({ ...sessionForm, nom_document: e.target.value })}
                   className="test-sessions-input"
                   placeholder="Ex: Plan de tests v1.0"
                 />
               </div>
              <div className="test-sessions-form-group">
                <label className="test-sessions-label">Description</label>
                <textarea
                  value={sessionForm.description}
                  onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })}
                  className="test-sessions-textarea"
                  placeholder="Description..."
                  rows={3}
                />
              </div>
              <div className="test-sessions-form-actions">
                <button type="button" className="test-sessions-cancel-button" onClick={() => setShowCreateModal(false)}>Annuler</button>
                <button type="submit" className="test-sessions-submit-button">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal édition */}
      {showModal && (
        <div className="test-sessions-modal">
          <div className="test-sessions-modal-content">
            <span className="test-sessions-modal-close-button" onClick={() => setShowModal(false)}>&times;</span>
            <h3 className="test-sessions-modal-title">Modifier la session</h3>
            <form onSubmit={handleUpdateSession} className="test-sessions-modal-form">
              <div className="test-sessions-form-group">
                <label className="test-sessions-label">Nom *</label>
                <input
                  type="text"
                  value={editFormData.nom}
                  onChange={(e) => setEditFormData({ ...editFormData, nom: e.target.value })}
                  className="test-sessions-input"
                  required
                />
              </div>
              <div className="test-sessions-form-row">
                <div className="test-sessions-form-group">
                  <label className="test-sessions-label">Application</label>
                  <select
                    value={editFormData.applicationId || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, applicationId: Number(e.target.value) })}
                    className="test-sessions-select"
                  >
                    {applications.map((app) => (
                      <option key={app.id} value={app.id}>{app.nom}</option>
                    ))}
                  </select>
                </div>
                <div className="test-sessions-form-group">
                  <label className="test-sessions-label">Statut</label>
                  <select
                    value={editFormData.statut}
                    onChange={(e) => {
                      console.log('Changement de statut:', e.target.value);
                      setEditFormData({ ...editFormData, statut: e.target.value });
                    }}
                    className="test-sessions-select"
                  >
                    <option value="En cours">En cours</option>
                    <option value="Terminée">Terminée</option>
                    <option value="Bloquée">Bloquée</option>
                  </select>
                </div>
              </div>
              <div className="test-sessions-form-row">
                <div className="test-sessions-form-group">
                  <label className="test-sessions-label">Environnement</label>
                  <input
                    type="text"
                    value={editFormData.environnement}
                    onChange={(e) => setEditFormData({ ...editFormData, environnement: e.target.value })}
                    className="test-sessions-input"
                  />
                </div>
                <div className="test-sessions-form-group">
                  <label className="test-sessions-label">Version</label>
                  <input
                    type="text"
                    value={editFormData.version}
                    onChange={(e) => setEditFormData({ ...editFormData, version: e.target.value })}
                    className="test-sessions-input"
                  />
                </div>
               </div>
               <div className="test-sessions-form-row">
                 <div className="test-sessions-form-group">
                   <label className="test-sessions-label">Environnement</label>
                   <input
                     type="text"
                     value={editFormData.environnement}
                     onChange={(e) => setEditFormData({ ...editFormData, environnement: e.target.value })}
                     className="test-sessions-input"
                     placeholder="Ex: Production"
                   />
                 </div>
                 <div className="test-sessions-form-group">
                   <label className="test-sessions-label">Version</label>
                   <input
                     type="text"
                     value={editFormData.version}
                     onChange={(e) => setEditFormData({ ...editFormData, version: e.target.value })}
                     className="test-sessions-input"
                     placeholder="Ex: 1.0.0"
                   />
                 </div>
                </div>
                <div className="test-sessions-form-group">
                  <label className="test-sessions-label">Nom du document</label>
                  <input
                    type="text"
                    value={editFormData.nom_document}
                    onChange={(e) => setEditFormData({ ...editFormData, nom_document: e.target.value })}
                    className="test-sessions-input"
                  />
                </div>
                <div className="test-sessions-form-group">
                  <label className="test-sessions-label">Rôle</label>
                  <input
                    type="text"
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    className="test-sessions-input"
                    placeholder="Ex: Admin, Testeur, etc."
                  />
                </div>
              <div className="test-sessions-form-group">
                <label className="test-sessions-label">Description</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="test-sessions-textarea"
                  rows={3}
                />
              </div>
              <div className="test-sessions-form-actions">
                <button type="button" className="test-sessions-cancel-button" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="test-sessions-submit-button">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestSessions;
