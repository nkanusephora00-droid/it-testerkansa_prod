import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { testSessionsAPI, applicationsAPI, usersAPI, Application } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash, faSearch, faSort, faChartBar, faClock, faCheckCircle, faExclamationTriangle, faPlayCircle, faTimesCircle, faEye } from '@fortawesome/free-solid-svg-icons';
import './TestSessions.css';

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
  tests?: Test[];
  total_tests?: number;
  tests_ok?: number;
  tests_bug?: number;
  tests_en_cours?: number;
  progression?: number;
  lastActivity?: string;
}

interface Test {
  id: number;
  fonction: string;
  statut: string;
}

const TestSessions: React.FC = () => {
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<TestSession[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSession, setEditingSession] = useState<TestSession | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date_creation' | 'nom' | 'statut' | 'progression'>('date_creation');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterApp, setFilterApp] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [isMobile, setIsMobile] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<number[]>([]);
  const [showExportMenu, setShowExportMenu] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({ 
    nom: '', 
    description: '', 
    applicationId: 0,
    environnement: '', 
    version: '',
    nom_document: '',
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

  const getAppName = useCallback((appId?: number) => {
    if (!appId) return 'Aucune';
    const app = applications.find(a => a.id === appId);
    return app ? app.nom : 'Application inconnue';
  }, [applications]);

  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? user.username : `Utilisateur ${userId}`;
  };

  const handleSelectSession = (sessionId: number) => {
    setSelectedSessions(prev => 
      prev.includes(sessionId) 
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedSessions.length === filteredSessions.length) {
      setSelectedSessions([]);
    } else {
      setSelectedSessions(filteredSessions.map(s => s.id));
    }
  };

  const handleConsolidate = async () => {
    if (selectedSessions.length === 0) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner au moins une session' });
      return;
    }
    
    try {
      // Simulation de consolidation - à adapter selon votre API
      setMessage({ type: 'success', text: `${selectedSessions.length} session(s) consolidée(s) avec succès!` });
      setSelectedSessions([]);
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors de la consolidation' });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const filteredAndSortedSessions = useMemo(() => {
    let filtered = sessions.filter(session => {
      const matchesSearch = session.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (session.description && session.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (session.environnement && session.environnement.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (session.version && session.version.toLowerCase().includes(searchTerm.toLowerCase())) ||
        getAppName(session.applicationId).toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || session.statut === filterStatus;
      const matchesApp = filterApp === 'all' || session.applicationId === parseInt(filterApp);
      const matchesUser = filterUser === 'all' || session.created_by === parseInt(filterUser);
      
      return matchesSearch && matchesStatus && matchesApp && matchesUser;
    });

    return filtered.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];
      
      if (sortBy === 'progression') {
        aValue = a.total_tests ? (a.tests_ok || 0) * 100 / a.total_tests : 0;
        bValue = b.total_tests ? (b.tests_ok || 0) * 100 / b.total_tests : 0;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [sessions, searchTerm, filterStatus, filterApp, filterUser, sortBy, sortOrder, getAppName]);

  useEffect(() => {
    setFilteredSessions(filteredAndSortedSessions);
  }, [filteredAndSortedSessions]);

  const fetchData = async () => {
    try {
      setError(null);
      const [sessionsData, appsData, usersData] = await Promise.all([
        testSessionsAPI.getAll(),
        applicationsAPI.getAll(),
        usersAPI.getAll(),
      ]);
      const sessions: any = sessionsData;
      const apps: any = appsData;
      const users: any = usersData;
      const sessionsList = Array.isArray(sessions) ? sessions : (sessions?.content || []);
      setSessions(sessionsList);
      setFilteredSessions(sessionsList);
      setApplications(Array.isArray(apps) ? apps : (apps?.content || []));
      setUsers(Array.isArray(users) ? users : (users?.content || []));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      const errorMessage = error.response?.data?.detail || 'Erreur de chargement des données';
      setError(errorMessage);
      setMessage({ type: 'error', text: errorMessage });
      if (process.env.NODE_ENV === 'development') {
        console.error('Fetch error:', err);
      }
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await testSessionsAPI.create(formData);
      setMessage({ type: 'success', text: 'Session ajoutée avec succès!' });
      setFormData({ 
        nom: '', 
        description: '', 
        applicationId: 0,
        environnement: '', 
        version: '',
        nom_document: '',
        statut: 'En cours'
      });
      setShowCreateModal(false);
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      const errorMessage = error.response?.data?.detail || 'Erreur lors de l\'ajout';
      setMessage({ type: 'error', text: errorMessage });
      if (process.env.NODE_ENV === 'development') {
        console.error('Create error:', err);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    
    setActionLoading(true);
    try {
      await testSessionsAPI.update(editingSession.id, editFormData);
      setMessage({ type: 'success', text: 'Session mise à jour avec succès!' });
      setShowModal(false);
      setEditingSession(null);
      setEditFormData({ 
        nom: '', 
        description: '', 
        applicationId: 0,
        environnement: '', 
        version: '',
        nom_document: '',
        statut: 'En cours'
      });
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      const errorMessage = error.response?.data?.detail || 'Erreur lors de la mise à jour';
      setMessage({ type: 'error', text: errorMessage });
      if (process.env.NODE_ENV === 'development') {
        console.error('Update error:', err);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleGeneratePDF = async (id: number, sessionName: string) => {
    try {
      // Simulation de génération PDF - à adapter selon votre API
      console.log(`Génération PDF pour la session ${id}: ${sessionName}`);
      setMessage({ type: 'success', text: 'Document PDF généré avec succès!' });
      setShowExportMenu(null);
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors de la génération du document PDF' });
    }
  };

  const handleGenerateWord = async (id: number, sessionName: string) => {
    try {
      // Récupérer les détails de la session pour générer le document Word
      const session = filteredSessions.find(s => s.id === id);
      if (!session) {
        setMessage({ type: 'error', text: 'Session non trouvée' });
        return;
      }

      // Créer le contenu du document Word
      const wordContent = `
        RAPPORT DE SESSION DE TEST - ${sessionName}
        ==========================================
        
        INFORMATIONS GÉNÉRALES
        ------------------------
        Nom de la session: ${session.nom}
        Application: ${getAppName(session.applicationId || 0)}
        ${session.environnement ? `Environnement: ${session.environnement}` : ''}
        ${session.version ? `Version: ${session.version}` : ''}
        Statut: ${session.statut}
        Date de création: ${new Date(session.date_creation).toLocaleDateString('fr-FR')}
        ${session.created_by ? `Créé par: ${getUserName(session.created_by)}` : 'Créé par: Système'}
        
        DESCRIPTION
        -----------
        ${session.description || 'Aucune description disponible'}
        
        PROGRESSION DES TESTS
        --------------------
        ${session.total_tests ? `Tests complétés: ${session.tests_ok || 0} / ${session.total_tests}` : 'Aucun test associé'}
        ${session.total_tests ? `Taux de réussite: ${Math.round((session.tests_ok || 0) * 100 / session.total_tests)}%` : ''}
        
        INFORMATIONS TECHNIQUES
        ----------------------
        Jamais modifié
        
        STATUT
        ------
        Ce rapport a été généré automatiquement le ${new Date().toLocaleDateString('fr-FR')}
        Pour toute question, veuillez contacter l'administrateur système.
      `;

      // Créer un blob avec le contenu
      const blob = new Blob([wordContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Rapport_Session_${sessionName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setMessage({ type: 'success', text: 'Document Word généré avec succès!' });
      setShowExportMenu(null);
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors de la génération du document Word' });
    }
  };

  const toggleExportMenu = (sessionId: number) => {
    setShowExportMenu(showExportMenu === sessionId ? null : sessionId);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) return;
    
    setActionLoading(true);
    try {
      await testSessionsAPI.delete(id);
      setMessage({ type: 'success', text: 'Session supprimée avec succès!' });
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      const errorMessage = error.response?.data?.detail || 'Erreur lors de la suppression';
      setMessage({ type: 'error', text: errorMessage });
      if (process.env.NODE_ENV === 'development') {
        console.error('Delete error:', err);
      }
    } finally {
      setActionLoading(false);
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

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'En cours': return faPlayCircle;
      case 'Terminée': return faCheckCircle;
      case 'Bloquée': return faExclamationTriangle;
      default: return faClock;
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'En cours': return '#3498db';
      case 'Terminée': return '#27ae60';
      case 'Bloquée': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const toggleSort = (field: 'date_creation' | 'nom' | 'statut' | 'progression') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSessionStats = useMemo(() => {
    const total = sessions.length;
    const enCours = sessions.filter(s => s.statut === 'En cours').length;
    const terminees = sessions.filter(s => s.statut === 'Terminée').length;
    const bloquees = sessions.filter(s => s.statut === 'Bloquée').length;
    const avgProgression = sessions.length > 0 
      ? sessions.reduce((acc, s) => acc + (s.total_tests ? (s.tests_ok || 0) * 100 / s.total_tests : 0), 0) / sessions.length 
      : 0;
    
    return { total, enCours, terminees, bloquees, avgProgression };
  }, [sessions]);

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.pageTitle}>Gestion des sessions professionnelles</h2>
            <p style={styles.pageSubtitle}>Organisez vos campagnes de test par application et suivez leur progression.</p>
          </div>
          <div style={styles.headerActions}>
            <div style={styles.viewToggle}>
              <button 
                style={{...styles.viewButton, ...(viewMode === 'table' ? styles.activeView : {})}}
                onClick={() => setViewMode('table')}
                title="Vue tableau"
              >
                <FontAwesomeIcon icon={faChartBar} />
              </button>
              <button 
                style={{...styles.viewButton, ...(viewMode === 'cards' ? styles.activeView : {})}}
                onClick={() => setViewMode('cards')}
                title="Vue cartes"
              >
                <FontAwesomeIcon icon={faEye} />
              </button>
            </div>
            {selectedSessions.length > 0 && (
              <button 
                style={{...styles.primaryButton, backgroundColor: '#ff6b6b'}} 
                onClick={handleConsolidate}
              >
                Consolider ({selectedSessions.length})
              </button>
            )}
            <button style={styles.primaryButton} onClick={() => setShowCreateModal(true)}>
              Nouvelle session
            </button>
          </div>
        </div>

        <div style={styles.statsContainer}>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, backgroundColor: '#3498db20', color: '#3498db'}}>
              <FontAwesomeIcon icon={faChartBar} />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{getSessionStats.total}</div>
              <div style={styles.statLabel}>Total sessions</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, backgroundColor: '#3498db20', color: '#3498db'}}>
              <FontAwesomeIcon icon={faPlayCircle} />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{getSessionStats.enCours}</div>
              <div style={styles.statLabel}>En cours</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, backgroundColor: '#27ae6020', color: '#27ae60'}}>
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{getSessionStats.terminees}</div>
              <div style={styles.statLabel}>Terminées</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, backgroundColor: '#e74c3c20', color: '#e74c3c'}}>
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{getSessionStats.bloquees}</div>
              <div style={styles.statLabel}>Bloquées</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, backgroundColor: '#f39c1220', color: '#f39c12'}}>
              <FontAwesomeIcon icon={faChartBar} />
            </div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{getSessionStats.avgProgression.toFixed(1)}%</div>
              <div style={styles.statLabel}>Progression moyenne</div>
            </div>
          </div>
        </div>
        
        {message.text && (
          <div style={message.type === 'success' ? styles.success : styles.error}>
            {message.text}
          </div>
        )}

        <div style={styles.tableSection}>
          <div style={styles.listHeader}>
            <div>
              <h3 style={styles.sectionTitle}>Liste des sessions</h3>
              <div style={styles.stats}>
                <span style={styles.statItem}>Total: {sessions.length}</span>
                <span style={styles.statItem}>Affichées: {filteredSessions.length}</span>
              </div>
            </div>
            <div style={styles.controlsRow}>
              <div style={styles.filters}>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={styles.filterSelect}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="En cours">En cours</option>
                  <option value="Terminée">Terminée</option>
                  <option value="Bloquée">Bloquée</option>
                </select>
                <select
                  value={filterApp}
                  onChange={(e) => setFilterApp(e.target.value)}
                  style={styles.filterSelect}
                >
                  <option value="all">Toutes les applications</option>
                  {applications.map(app => (
                    <option key={app.id} value={app.id}>{app.nom}</option>
                  ))}
                </select>
                <select
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value)}
                  style={styles.filterSelect}
                >
                  <option value="all">Tous les utilisateurs</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.username}</option>
                  ))}
                </select>
              </div>
              <div style={styles.searchWrapper}>
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.searchInput}
                />
              </div>
            </div>
          </div>
          {initialLoading ? (
            <div style={styles.loadingContainer}>
              <div style={styles.spinner}></div>
              <p>Chargement des sessions...</p>
            </div>
          ) : error ? (
            <div style={styles.errorContainer}>
              <FontAwesomeIcon icon={faTimesCircle} className="error-icon" />
              <h3>Erreur de chargement</h3>
              <p>{error}</p>
              <button style={styles.retryButton} onClick={fetchData}>
                Réessayer
              </button>
            </div>
          ) : isMobile ? (
            <div style={styles.simpleMobileList}>
              {filteredSessions.map((session) => (
                <div key={session.id} style={styles.simpleMobileItem}>
                  <div style={styles.simpleItemHeader}>
                    <span style={styles.simpleItemTitle}>{session.nom}</span>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: getStatusColor(session.statut) + '20',
                      color: getStatusColor(session.statut)
                    }}>
                      {session.statut}
                    </span>
                  </div>
                  <div style={styles.simpleItemContent}>
                    <div style={styles.simpleItemRow}>
                      <span style={styles.simpleItemLabel}>App:</span>
                      <span style={styles.simpleItemValue}>{getAppName(session.applicationId)}</span>
                    </div>
                    {session.environnement && (
                      <div style={styles.simpleItemRow}>
                        <span style={styles.simpleItemLabel}>Env:</span>
                        <span style={styles.simpleItemValue}>{session.environnement}</span>
                      </div>
                    )}
                    {session.total_tests && (
                      <div style={styles.simpleItemRow}>
                        <span style={styles.simpleItemLabel}>Progression:</span>
                        <span style={styles.simpleItemValue}>{session.tests_ok || 0}/{session.total_tests}</span>
                      </div>
                    )}
                    {session.created_by && (
                      <div style={styles.simpleItemRow}>
                        <span style={styles.simpleItemLabel}>Créé par:</span>
                        <span style={styles.simpleItemValue}>{getUserName(session.created_by)}</span>
                      </div>
                    )}
                  </div>
                  <div style={styles.simpleItemActions}>
                    <div style={{ position: 'relative' }}>
                      <button style={styles.simpleActionButton} onClick={() => toggleExportMenu(session.id)}>
                        📄
                      </button>
                      {showExportMenu === session.id && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          right: '0',
                          backgroundColor: 'white',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          zIndex: 1000,
                          minWidth: '120px'
                        }}>
                          <button
                            style={{
                              display: 'block',
                              width: '100%',
                              padding: '8px 12px',
                              border: 'none',
                              backgroundColor: 'transparent',
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                            onClick={() => handleGeneratePDF(session.id, session.nom)}
                          >
                            📄 PDF
                          </button>
                          <button
                            style={{
                              display: 'block',
                              width: '100%',
                              padding: '8px 12px',
                              border: 'none',
                              backgroundColor: 'transparent',
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                            onClick={() => handleGenerateWord(session.id, session.nom)}
                          >
                            📄 Word
                          </button>
                        </div>
                      )}
                    </div>
                    <button style={styles.simpleActionButton} onClick={() => openEditModal(session)}>
                      ✏️
                    </button>
                    <button style={styles.simpleActionButton} onClick={() => handleDelete(session.id)}>
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : viewMode === 'cards' ? (
            <div style={styles.cardsGrid}>
              {filteredSessions.map((session) => (
                <div key={session.id} style={{...styles.sessionCard, ...(isMobile ? styles.sessionCardMobile : {})}}>
                  <div style={styles.cardHeader}>
                    <h4 style={styles.cardTitle}>{session.nom}</h4>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: getStatusColor(session.statut) + '20',
                      color: getStatusColor(session.statut),
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <FontAwesomeIcon icon={getStatusIcon(session.statut)} style={{ fontSize: '10px' }} />
                      {session.statut}
                    </span>
                  </div>
                  
                  <div style={styles.cardContent}>
                    <div style={styles.cardInfo}>
                      <span style={styles.infoLabel}>Application:</span>
                      <span style={styles.infoValue}>{getAppName(session.applicationId)}</span>
                    </div>
                    {session.environnement && (
                      <div style={styles.cardInfo}>
                        <span style={styles.infoLabel}>Environnement:</span>
                        <span style={styles.infoValue}>{session.environnement}</span>
                      </div>
                    )}
                    {session.version && (
                      <div style={styles.cardInfo}>
                        <span style={styles.infoLabel}>Version:</span>
                        <span style={styles.infoValue}>{session.version}</span>
                      </div>
                    )}
                    {session.description && (
                      <p style={styles.cardDescription}>{session.description}</p>
                    )}
                  </div>
                  
                  {session.total_tests && (
                    <div style={styles.progressSection}>
                      <div style={styles.progressHeader}>
                        <span style={styles.progressLabel}>Progression</span>
                        <span style={styles.progressText}>
                          {session.tests_ok || 0}/{session.total_tests}
                        </span>
                      </div>
                      <div style={styles.progressBar}>
                        <div style={{ 
                          width: `${(session.tests_ok || 0) * 100 / session.total_tests}%`, 
                          height: '100%', 
                          backgroundColor: '#27ae60',
                          borderRadius: '3px',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  )}
                  
                  <div style={styles.cardActions}>
                    <button 
                      style={{...styles.editButton, padding: '8px 12px', backgroundColor: 'transparent', color: '#007bff'}} 
                      onClick={() => handleGenerateWord(session.id, session.nom)} 
                      title="Générer Word"
                      disabled={actionLoading}
                    >
                      📄
                    </button>
                    <button 
                      style={{...styles.editButton, padding: '8px 12px', backgroundColor: 'transparent', color: '#3498db'}} 
                      onClick={() => openEditModal(session)} 
                      title="Modifier"
                      disabled={actionLoading}
                    >
                      <FontAwesomeIcon icon={faPen} />
                    </button>
                    <button 
                      style={{...styles.deleteButton, padding: '8px 12px', backgroundColor: 'transparent', color: '#ff6b6b'}} 
                      onClick={() => handleDelete(session.id)} 
                      title="Supprimer"
                      disabled={actionLoading}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : !isMobile && viewMode === 'table' ? (
            <div style={{ overflowX: 'auto', margin: '0 -12px', padding: '0 12px' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableTh}>
                      <input
                        type="checkbox"
                        checked={selectedSessions.length === filteredSessions.length && filteredSessions.length > 0}
                        onChange={handleSelectAll}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    <th style={styles.tableTh}>
                      <button style={styles.sortableHeader} onClick={() => toggleSort('date_creation')}>
                        ID
                        {sortBy === 'date_creation' && (
                          <FontAwesomeIcon icon={faSort} style={{ marginLeft: '4px', fontSize: '10px' }} />
                        )}
                      </button>
                    </th>
                    <th style={styles.tableTh}>
                      <button style={styles.sortableHeader} onClick={() => toggleSort('nom')}>
                        Nom
                        {sortBy === 'nom' && (
                          <FontAwesomeIcon icon={faSort} style={{ marginLeft: '4px', fontSize: '10px' }} />
                        )}
                      </button>
                    </th>
                    <th style={styles.tableTh}>Application</th>
                    <th style={styles.tableTh}>Environnement</th>
                    <th style={styles.tableTh}>Version</th>
                    <th style={styles.tableTh}>
                      <button style={styles.sortableHeader} onClick={() => toggleSort('statut')}>
                        Statut
                        {sortBy === 'statut' && (
                          <FontAwesomeIcon icon={faSort} style={{ marginLeft: '4px', fontSize: '10px' }} />
                        )}
                      </button>
                    </th>
                    <th style={styles.tableTh}>
                      <button style={styles.sortableHeader} onClick={() => toggleSort('progression')}>
                        Progression
                        {sortBy === 'progression' && (
                          <FontAwesomeIcon icon={faSort} style={{ marginLeft: '4px', fontSize: '10px' }} />
                        )}
                      </button>
                    </th>
                    <th style={styles.tableTh}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((session) => (
                    <tr key={session.id} style={styles.tableTrHover}>
                      <td style={styles.tableTd}>
                        <input
                          type="checkbox"
                          checked={selectedSessions.includes(session.id)}
                          onChange={() => handleSelectSession(session.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td style={styles.tableTd}>{session.id}</td>
                      <td style={styles.tableTd}>{session.nom}</td>
                      <td style={styles.tableTd}>{getAppName(session.applicationId)}</td>
                      <td style={styles.tableTd}>{session.environnement || '-'}</td>
                      <td style={styles.tableTd}>{session.version || '-'}</td>
                      <td style={styles.tableTd}>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: getStatusColor(session.statut) + '20',
                          color: getStatusColor(session.statut),
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <FontAwesomeIcon icon={getStatusIcon(session.statut)} style={{ fontSize: '10px' }} />
                          {session.statut}
                        </span>
                      </td>
                      <td style={styles.tableTd}>
                        {session.total_tests ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ 
                              flex: 1, 
                              height: '6px', 
                              backgroundColor: 'var(--border-color)', 
                              borderRadius: '3px',
                              overflow: 'hidden'
                            }}>
                              <div style={{ 
                                width: `${session.total_tests ? (session.tests_ok || 0) * 100 / session.total_tests : 0}%`, 
                                height: '100%', 
                                backgroundColor: '#27ae60' 
                              }} />
                            </div>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {session.tests_ok || 0}/{session.total_tests}
                            </span>
                          </div>
                        ) : '-'}
                      </td>
                      <td style={{...styles.tableTd, display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative' }}>
                          <button style={{...styles.editButton, padding: '8px 12px', backgroundColor: 'transparent', color: '#007bff'}} onClick={() => toggleExportMenu(session.id)} title="Exporter">
                            📄
                          </button>
                          {showExportMenu === session.id && (
                            <div style={{
                              position: 'absolute',
                              top: '100%',
                              right: '0',
                              backgroundColor: 'white',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                              zIndex: 1000,
                              minWidth: '120px'
                            }}>
                              <button
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  padding: '8px 12px',
                                  border: 'none',
                                  backgroundColor: 'transparent',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                                onClick={() => handleGeneratePDF(session.id, session.nom)}
                              >
                                📄 PDF
                              </button>
                              <button
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  padding: '8px 12px',
                                  border: 'none',
                                  backgroundColor: 'transparent',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                                onClick={() => handleGenerateWord(session.id, session.nom)}
                              >
                                📄 Word
                              </button>
                            </div>
                          )}
                        </div>
                        <button style={{...styles.editButton, padding: '8px 12px', backgroundColor: 'transparent', color: '#3498db'}} onClick={() => openEditModal(session)} title="Modifier">
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                        <button style={{...styles.deleteButton, padding: '8px 12px', backgroundColor: 'transparent', color: '#ff6b6b'}} onClick={() => handleDelete(session.id)} title="Supprimer">
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={styles.cardsGrid}>
              {filteredSessions.map((session) => (
                <div key={session.id} style={styles.sessionCard}>
                  <div style={styles.cardHeader}>
                    <h4 style={styles.cardTitle}>{session.nom}</h4>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: getStatusColor(session.statut) + '20',
                      color: getStatusColor(session.statut),
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <FontAwesomeIcon icon={getStatusIcon(session.statut)} style={{ fontSize: '10px' }} />
                      {session.statut}
                    </span>
                  </div>
                  
                  <div style={styles.cardContent}>
                    <div style={styles.cardInfo}>
                      <span style={styles.infoLabel}>Application:</span>
                      <span style={styles.infoValue}>{getAppName(session.applicationId)}</span>
                    </div>
                    {session.environnement && (
                      <div style={styles.cardInfo}>
                        <span style={styles.infoLabel}>Environnement:</span>
                        <span style={styles.infoValue}>{session.environnement}</span>
                      </div>
                    )}
                    {session.version && (
                      <div style={styles.cardInfo}>
                        <span style={styles.infoLabel}>Version:</span>
                        <span style={styles.infoValue}>{session.version}</span>
                      </div>
                    )}
                    {session.created_by && (
                      <div style={styles.cardInfo}>
                        <span style={styles.infoLabel}>Créé par:</span>
                        <span style={styles.infoValue}>{getUserName(session.created_by)}</span>
                      </div>
                    )}
                    {session.description && (
                      <p style={styles.cardDescription}>{session.description}</p>
                    )}
                  </div>
                  
                  {session.total_tests && (
                    <div style={styles.progressSection}>
                      <div style={styles.progressHeader}>
                        <span style={styles.progressLabel}>Progression</span>
                        <span style={styles.progressText}>
                          {session.tests_ok || 0}/{session.total_tests}
                        </span>
                      </div>
                      <div style={styles.progressBar}>
                        <div style={{ 
                          width: `${(session.tests_ok || 0) * 100 / session.total_tests}%`, 
                          height: '100%', 
                          backgroundColor: '#27ae60',
                          borderRadius: '3px',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  )}
                  
                  <div style={styles.cardActions}>
                    <button 
                      style={{...styles.editButton, padding: '8px 12px', backgroundColor: 'transparent', color: '#007bff'}} 
                      onClick={() => handleGenerateWord(session.id, session.nom)} 
                      title="Générer Word"
                      disabled={actionLoading}
                    >
                      📄
                    </button>
                    <button 
                      style={{...styles.editButton, padding: '8px 12px', backgroundColor: 'transparent', color: '#3498db'}} 
                      onClick={() => openEditModal(session)} 
                      title="Modifier"
                      disabled={actionLoading}
                    >
                      <FontAwesomeIcon icon={faPen} />
                    </button>
                    <button 
                      style={{...styles.deleteButton, padding: '8px 12px', backgroundColor: 'transparent', color: '#ff6b6b'}} 
                      onClick={() => handleDelete(session.id)} 
                      title="Supprimer"
                      disabled={actionLoading}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showCreateModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <span style={styles.close} onClick={() => setShowCreateModal(false)}>&times;</span>
            <div style={styles.modalHeader}>
              <h3 style={styles.sectionTitle}>Nouvelle session professionnelle</h3>
              <p style={styles.modalSubtitle}>Créez une session de test et liez-la à une application.</p>
            </div>
            <form onSubmit={handleSubmit} style={styles.modalForm}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nom du document de test</label>
                  <input
                    type="text"
                    placeholder="Ex: Tests Release v2.0"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Application </label>
                  <select
                    value={formData.applicationId || ''}
                    onChange={(e) => setFormData({ ...formData, applicationId: parseInt(e.target.value) })}
                    style={styles.select}
                    required
                  >
                    <option value="">Sélectionnez une application</option>
                    {applications.map(app => (
                      <option key={app.id} value={app.id}>{app.nom}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Environnement</label>
                  <input
                    type="text"
                    placeholder="Ex: Production, Recette, Dev"
                    value={formData.environnement}
                    onChange={(e) => setFormData({ ...formData, environnement: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Role</label>
                  <input
                    type="text"
                    placeholder="Ex: 2.0.0"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}></label>
                  <input
                    type="text"
                    placeholder="Ex: Recette_Fonctionnelle_v2.pdf"
                    value={formData.nom_document}
                    onChange={(e) => setFormData({ ...formData, nom_document: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Statut</label>
                  <select
                    value={formData.statut}
                    onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                    style={styles.select}
                  >
                    <option value="En cours">En cours</option>
                    <option value="Terminée">Terminée</option>
                    <option value="Bloquée">Bloquée</option>
                  </select>
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  placeholder="Objectifs, périmètre de la session de test..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ ...styles.textarea, minHeight: '80px' }}
                />
              </div>
              <div style={styles.formActions}>
                <button type="button" style={styles.secondaryButton} onClick={() => setShowCreateModal(false)}>Annuler</button>
                <button type="submit" style={styles.primaryButton}>Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <span style={styles.close} onClick={() => setShowModal(false)}>&times;</span>
            <h3 style={styles.sectionTitle}>Modifier la session</h3>
            <form onSubmit={handleEdit} style={styles.modalForm}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nom</label>
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
                    onChange={(e) => setEditFormData({ ...editFormData, applicationId: parseInt(e.target.value) })}
                    style={styles.select}
                    required
                  >
                    <option value="">Sélectionnez une application</option>
                    {applications.map(app => (
                      <option key={app.id} value={app.id}>{app.nom}</option>
                    ))}
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
              <div style={styles.formRow}>
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
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  style={{ ...styles.textarea, minHeight: '80px' }}
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
  main: { padding: '30px', maxWidth: '1400px', margin: '0 auto', minHeight: 'calc(100vh - 70px)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' as const, gap: '16px' },
  headerActions: { display: 'flex', alignItems: 'center', gap: '12px' },
  viewToggle: { display: 'flex', gap: '4px', backgroundColor: 'var(--bg-card)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' },
  viewButton: { padding: '8px 12px', backgroundColor: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-secondary)' },
  activeView: { backgroundColor: 'var(--primary-color)', color: 'white' },
  pageTitle: { margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '12px' },
  pageSubtitle: { margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' },
  
  // Stats container
  statsContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' },
  statsContainerMobile: { gridTemplateColumns: '1fr', gap: '12px', marginBottom: '20px' },
  statCard: { backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 8px var(--shadow-color)' },
  statIcon: { width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' },
  statContent: { flex: 1 },
  statNumber: { fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 },
  statLabel: { fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0 0' },
  
  // Filters and controls
  controlsRow: { display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' as const },
  filters: { display: 'flex', gap: '12px', flexWrap: 'wrap' as const },
  filterSelect: { padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '14px' },
  searchWrapper: { position: 'relative' as const, display: 'flex', alignItems: 'center' },
  
  tableSection: { backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px var(--shadow-color)' },
  sectionTitle: { margin: '0 0 20px', fontSize: '18px' },
  modalForm: { display: 'flex', flexDirection: 'column' as const, gap: '20px', padding: '8px 0' },
  formRow: { display: 'flex', gap: '16px', flexWrap: 'wrap' as const },
  formGroup: { marginBottom: '16px', flex: 1 },
  label: { display: 'block', marginBottom: '6px', fontWeight: 500, color: 'var(--text-secondary)', fontSize: '13px' },
  input: { width: '100%', padding: '12px 14px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '14px', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' },
  textarea: { width: '100%', padding: '12px 14px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '14px', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', resize: 'vertical' as const, minHeight: '100px' },
  select: { width: '100%', padding: '12px 14px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '14px', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' },
  formActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '20px', flexWrap: 'wrap' },
  primaryButton: { padding: '12px 20px', backgroundColor: 'var(--success-color)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' },
  secondaryButton: { padding: '12px 20px', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' },
  
  // Table styles
  table: { 
    width: '100%', 
    borderCollapse: 'separate' as const, 
    borderSpacing: '0',
    borderRadius: 'var(--radius-md)', 
    overflow: 'hidden',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-card)'
  },
  sortableHeader: { background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 },
  tableTh: { 
    padding: '12px', 
    textAlign: 'left' as const, 
    backgroundColor: 'var(--hover-bg)', 
    fontWeight: '600' as const, 
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
  searchInput: { padding: '10px 16px 10px 40px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '14px', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', minWidth: '250px' },
  stats: { display: 'flex', gap: '16px', marginBottom: '8px' },
  statItem: { fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' },
  deleteButton: { padding: '8px', backgroundColor: 'transparent', color: 'var(--danger-color)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' },
  editButton: { padding: '8px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' },
  listHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' as const, gap: '12px' },
  success: { padding: '14px', backgroundColor: 'var(--success-color)', color: 'white', borderRadius: 'var(--radius-md)', marginBottom: '20px' },
  error: { padding: '14px', backgroundColor: 'var(--danger-color)', color: 'white', borderRadius: 'var(--radius-md)', marginBottom: '20px' },
  modal: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', zIndex: 9999, paddingTop: '40px', overflowY: 'auto' as const, backdropFilter: 'blur(4px)' },
  modalContent: { backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', width: '95%', maxWidth: '500px', position: 'relative' as const, margin: '0 auto 40px auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', border: '1px solid var(--border-light)' },
  close: { position: 'absolute' as const, top: '15px', right: '20px', fontSize: '28px', cursor: 'pointer', color: 'var(--text-muted)' },
  // Loading and error states
  loadingContainer: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' as const },
  spinner: { width: '40px', height: '40px', border: '4px solid var(--border-color)', borderTop: '4px solid var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' },
  errorContainer: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' as const },
  errorIcon: { fontSize: '48px', color: 'var(--danger-color)', marginBottom: '16px' },
  retryButton: { padding: '12px 24px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '16px' },
  
  // Card view styles
  cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px', padding: '0 12px' },
  cardsGridMobile: { display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 12px' },
  sessionCard: { backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px var(--shadow-color)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' },
  sessionCardMobile: { padding: '12px 16px', marginBottom: '0', borderRadius: '8px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '12px' },
  cardTitle: { margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', flex: 1 },
  cardContent: { marginBottom: '16px' },
  cardInfo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '14px' },
  infoLabel: { color: 'var(--text-secondary)', fontWeight: '500' },
  infoValue: { color: 'var(--text-primary)', fontWeight: '600' },
  cardDescription: { margin: '12px 0 0 0', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' },
  progressSection: { marginBottom: '16px' },
  progressHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  progressLabel: { fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' },
  progressText: { fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' },
  progressBar: { height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' },
  cardActions: { display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' },
  
  // Simple mobile list styles
  simpleMobileList: { display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 12px' },
  simpleMobileItem: { backgroundColor: 'var(--bg-card)', borderRadius: '8px', padding: '12px 16px', border: '1px solid var(--border-color)', marginBottom: '0' },
  simpleItemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  simpleItemTitle: { fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', flex: 1 },
  simpleItemContent: { marginBottom: '8px' },
  simpleItemRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontSize: '13px' },
  simpleItemLabel: { color: 'var(--text-secondary)', fontWeight: '500' },
  simpleItemValue: { color: 'var(--text-primary)', fontWeight: '600' },
  simpleItemActions: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
  simpleActionButton: { padding: '6px 10px', backgroundColor: 'var(--hover-bg)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)' },
  
  // Animation keyframes (removed as CSS-in-JS doesn't support keyframes well)
};

export default TestSessions;