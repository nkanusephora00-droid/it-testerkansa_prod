import React, { useEffect, useState, useCallback } from 'react';
import { testsAPI, testSessionsAPI, applicationsAPI, api, Test, TestSession, Application } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faPlay, faCheck, faTimes, faCompress, faExpand, faEye, faFilePdf, faFileWord } from '@fortawesome/free-solid-svg-icons';
import { ConsolidatedSession, consolidateSessionsByUser, consolidateAllSessions } from '../utils/sessionConsolidation';
import '../styles/pages/Tests.css';

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

const Tests: React.FC = () => {
  const isMobile = useResponsive(); // Utilisation du hook responsive
  const [tests, setTests] = useState<Test[]>([]);
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [allSessions, setAllSessions] = useState<TestSession[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [view, setView] = useState<'sessions' | 'tests'>('sessions');
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [consolidationMode, setConsolidationMode] = useState<'none' | 'byUser' | 'global'>('none');
  const [consolidatedSessions, setConsolidatedSessions] = useState<ConsolidatedSession[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<number[]>([]);
  const [selectionMode, setSelectionMode] = useState<boolean>(false);
  
  // Récupérer le rôle de l'utilisateur
  const userRole = localStorage.getItem('user_role');
  const isAdmin = userRole === 'admin';
  console.log('User role:', userRole, 'Is admin:', isAdmin);

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'Terminé':
        return '#28a745';
      case 'BUG':
        return '#dc3545';
      case 'En cours':
      default:
        return '#ffc107';
    }
  };
  
  // Session form state
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);
  const [sessionForm, setSessionForm] = useState({ 
    nom: '', 
    description: '', 
    applicationId: 0,
    environnement: '',
    version: '',
    nom_document: '',
    statut: 'En cours' 
  });
  
  // Test form state
  const [formData, setFormData] = useState({
    sessionId: 0,
    applicationId: 0,
    fonction: '',
    precondition: '',
    etapes: '',
    resultatAttendu: '',
    resultatObtenu: '',
    statut: '',
    commentaires: '',
    image: ''
  });

  // Image preview
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Edit test states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);

  // Edit session states
  const [showEditSessionModal, setShowEditSessionModal] = useState(false);
  const [editingSession, setEditingSession] = useState<TestSession | null>(null);
  const [editSessionForm, setEditSessionForm] = useState({
    nom: '',
    description: '',
    applicationId: 0,
    environnement: '',
    version: '',
    nom_document: '',
    statut: 'En cours'
  });

  // Pré-remplir le formulaire avec les valeurs de la session sélectionnée
  useEffect(() => {
    if (selectedSession) {
      const currentSession = sessions.find(s => s.id === selectedSession);
      if (currentSession) {
        setFormData(prev => ({
          ...prev,
          sessionId: selectedSession,
          applicationId: currentSession.applicationId || 0
        }));
      }
    }
  }, [selectedSession, sessions]);

  const fetchData = useCallback(async () => {
    try {
      const [testsData, appsData] = await Promise.all([
        testsAPI.getAll(),
        applicationsAPI.getAll()
      ]);
      setTests(testsData);
      setApplications(appsData);
      await fetchSessions();
      if (isAdmin) {
        await fetchUsers();
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') { console.error(err); }
      setMessage({ type: 'error', text: 'Erreur de chargement' });
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedUser !== null) {
      const filteredSessions = allSessions.filter(session => session.created_by === selectedUser);
      setSessions(filteredSessions);
    } else {
      setSessions(allSessions);
    }
  }, [selectedUser, allSessions]);

  async function fetchSessions() {
    try {
      const data = await testSessionsAPI.getAll();
      setAllSessions(data);
      setSessions(data);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching sessions:', err);
      }
    }
  };

  async function fetchUsers() {
    try {
      console.log('Fetching users...');
      const response = await api.get('/users');
      console.log('Users API response:', response.data);
      setUsers(Array.isArray(response.data) ? response.data : []);
      console.log('Users set:', Array.isArray(response.data) ? response.data.length : 'not an array');
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching users:', err);
      }
      setUsers([]);
    }
  };

  const handleConsolidateByUser = () => {
    const sessionsToConsolidate = selectedSessions.length > 0 
      ? allSessions.filter(s => selectedSessions.includes(s.id))
      : allSessions;
    
    if (sessionsToConsolidate.length === 0) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner au moins une session à consolider' });
      return;
    }
    
    const consolidated = consolidateSessionsByUser(sessionsToConsolidate);
    setConsolidatedSessions(consolidated);
    setConsolidationMode('byUser');
    setSelectionMode(false);
    setSelectedSessions([]);
    setMessage({ type: 'success', text: `Consolidation par utilisateur: ${consolidated.length} session(s) créée(s) à partir de ${sessionsToConsolidate.length} session(s) sélectionnée(s)` });
  };

  const handleConsolidateGlobal = () => {
    const sessionsToConsolidate = selectedSessions.length > 0 
      ? allSessions.filter(s => selectedSessions.includes(s.id))
      : allSessions;
    
    if (sessionsToConsolidate.length === 0) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner au moins une session à consolider' });
      return;
    }
    
    const globalSession = consolidateAllSessions(sessionsToConsolidate);
    setConsolidatedSessions([globalSession]);
    setConsolidationMode('global');
    setSelectionMode(false);
    setSelectedSessions([]);
    setMessage({ type: 'success', text: `Consolidation globale: 1 session créée avec ${globalSession.total_tests} tests à partir de ${sessionsToConsolidate.length} session(s) sélectionnée(s)` });
  };

  const handleResetConsolidation = () => {
    setConsolidationMode('none');
    setConsolidatedSessions([]);
    setSessions(allSessions);
    setMessage({ type: 'info', text: 'Affichage des sessions normales réactivé' });
  };

  const handleToggleSessionSelection = (sessionId: number) => {
    setSelectedSessions(prev => 
      prev.includes(sessionId) 
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const handleSelectAllSessions = () => {
    setSelectedSessions(allSessions.map(s => s.id));
  };

  const handleClearSelection = () => {
    setSelectedSessions([]);
  };

  const handleToggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedSessions([]);
  };

  const handleViewConsolidatedSession = (consolidated: ConsolidatedSession) => {
    // Créer une session temporaire pour les tests consolidés
    const tempSession: TestSession = {
      id: consolidated.id,
      nom: consolidated.nom,
      description: consolidated.description,
      date_creation: consolidated.date_creation,
      statut: consolidated.statut,
      created_by: consolidated.userId,
      createdByUsername: consolidated.username,
      tests: consolidated.consolidatedTests,
      total_tests: consolidated.total_tests,
      tests_ok: consolidated.tests_ok,
      tests_bug: consolidated.tests_bug,
      tests_en_cours: consolidated.tests_en_cours
    };
    
    setSelectedSession(consolidated.id);
    setView('tests');
    
    // Stocker temporairement les données consolidées pour l'affichage
    (window as any).tempConsolidatedSession = tempSession;
  };

  const handleExportConsolidatedPDF = (consolidated: ConsolidatedSession) => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('fr-FR', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${consolidated.nom}</title>
        <style>
          @page { 
            size: A4 landscape;
            margin: 15mm; 
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { height: auto; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #333; font-size: 14px; line-height: 1.4; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #2c3e50; padding-bottom: 12px; page-break-after: avoid; }
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
          .stat-encours { background: #f39c12; color: white; }
          .consolidation-info { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 15px; margin: 15px 0; }
          .consolidation-title { font-weight: 600; color: #495057; margin-bottom: 8px; }
          .original-sessions { font-size: 12px; color: #6c757d; }
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
          <h1>Rapport de Tests Consolidés</h1>
          <div class="session-name">${consolidated.nom}</div>
        </div>
        
        <div class="session-info">
          <div class="info-item">
            <div class="info-label">Utilisateur</div>
            <div class="info-value">${consolidated.username}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Date</div>
            <div class="info-value">${new Date(consolidated.date_creation).toLocaleDateString('fr-FR')}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Statut</div>
            <div class="info-value">${consolidated.statut}</div>
          </div>
        </div>

        <div class="stats">
          <div class="stat-box stat-total">
            <div>Total: ${consolidated.total_tests}</div>
          </div>
          <div class="stat-box stat-ok">
            <div>OK: ${consolidated.tests_ok}</div>
          </div>
          <div class="stat-box stat-bug">
            <div>BUG: ${consolidated.tests_bug}</div>
          </div>
          <div class="stat-box stat-encours">
            <div>En cours: ${consolidated.tests_en_cours}</div>
          </div>
        </div>

        <div class="consolidation-info">
          <div class="consolidation-title">Information de Consolidation</div>
          <div>Cette session consolidée fusionne ${consolidated.originalSessions.length} session(s) originale(s)</div>
          <div class="original-sessions">
            Sessions originales: ${consolidated.originalSessions.map(s => s.nom).join(', ')}
          </div>
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
            ${consolidated.consolidatedTests.map((test: Test) => `
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
          Généré le ${formattedDate} - Session consolidée de ${consolidated.username}
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const handleExportConsolidatedWord = async (consolidated: ConsolidatedSession) => {
    try {
      const today = new Date();
      const formattedDate = today.toLocaleDateString('fr-FR', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      });

      // Créer les lignes du tableau pour les tests consolidés
      const tableRows = [
        // En-tête du tableau
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Fonction", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Précondition", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Étapes", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Résultat Attendu", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Résultat Obtenu", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Statut", bold: true })] })] })
          ]
        })
      ];

      // Ajouter chaque test consolidé comme une ligne du tableau
      consolidated.consolidatedTests.forEach((test: Test) => {
        tableRows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: test.fonction || '-' })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: test.precondition || '-' })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: test.etapes || '-' })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: test.resultatAttendu || '-' })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: test.resultatObtenu || '-' })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: test.statut || '-' })] })] })
            ]
          })
        );
      });

      // Créer le document Word pour les sessions consolidées
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // En-tête
            new Paragraph({
              children: [
                new TextRun({
                  text: "Rapport de Tests Consolidés",
                  bold: true,
                  size: 32
                })
              ],
              alignment: AlignmentType.CENTER
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: consolidated.nom,
                  italics: true,
                  size: 20
                })
              ],
              alignment: AlignmentType.CENTER
            }),
            new Paragraph({ text: "" }), // Espace
            
            // Informations de la session consolidée
            new Paragraph({
              children: [
                new TextRun({ text: `Utilisateur: ${consolidated.username}` }),
                new TextRun({ text: "\t" }),
                new TextRun({ text: `Date: ${new Date(consolidated.date_creation).toLocaleDateString('fr-FR')}` }),
                new TextRun({ text: "\t" }),
                new TextRun({ text: `Statut: ${consolidated.statut}` })
              ],
              alignment: AlignmentType.CENTER
            }),
            new Paragraph({ text: "" }), // Espace
            
            // Statistiques
            new Paragraph({
              children: [
                new TextRun({ text: `Total: ${consolidated.total_tests}` }),
                new TextRun({ text: "\t" }),
                new TextRun({ text: `OK: ${consolidated.tests_ok}` }),
                new TextRun({ text: "\t" }),
                new TextRun({ text: `BUG: ${consolidated.tests_bug}` }),
                new TextRun({ text: "\t" }),
                new TextRun({ text: `En cours: ${consolidated.tests_en_cours}` })
              ],
              alignment: AlignmentType.CENTER
            }),
            new Paragraph({ text: "" }), // Espace
            
            // Information de consolidation
            new Paragraph({
              children: [
                new TextRun({
                  text: "Information de Consolidation",
                  bold: true
                })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Cette session consolidée fusionne ${consolidated.originalSessions.length} session(s) originale(s)` })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Sessions originales: ${consolidated.originalSessions.map(s => s.nom).join(', ')}` })
              ]
            }),
            new Paragraph({ text: "" }), // Espace
            
            // Tableau des tests consolidés
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: tableRows
            }),
            new Paragraph({ text: "" }), // Espace
            
            // Pied de page
            new Paragraph({
              children: [
                new TextRun({ text: `Généré le ${formattedDate} - Session consolidée de ${consolidated.username}` })
              ],
              alignment: AlignmentType.CENTER
            })
          ]
        }]
      });

      // Générer le blob et télécharger
      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Rapport_Consolidated_${consolidated.nom.replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setMessage({ type: 'success', text: 'Document Word consolidé généré avec succès!' });
    } catch (err) {
      console.error('Erreur détaillée lors de la génération Word consolidé:', err);
      setMessage({ type: 'error', text: 'Erreur lors de la génération du document Word consolidé' });
    }
  };

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
         statut: sessionForm.statut
       };
       const newSession = await testSessionsAPI.create(sessionData);
       setMessage({ type: 'success', text: 'Session créée avec succès!' });
       setShowSessionModal(false);
       setSessionForm({ nom: '', description: '', applicationId: 0, environnement: '', version: '', nom_document: '', statut: 'En cours' });
       fetchSessions();
       // Automatically select the newly created session
       setSelectedSession(newSession.id);
     } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string | unknown[] } } };
      const detail = error.response?.data?.detail;
      let errorText = 'Erreur lors de la création';
      if (typeof detail === 'string') {
        errorText = detail;
      } else if (Array.isArray(detail)) {
        errorText = (detail as unknown[]).map((e: unknown) => {
          const err = e as { msg?: string };
          return err.msg || JSON.stringify(e);
        }).join(', ');
      }
      setMessage({ type: 'error', text: errorText });
    }
  };

  const handleDeleteSession = async (id: number) => {
    const session = sessions.find(s => s.id === id);
    if (session && session.statut === 'Terminé') {
      setMessage({ type: 'error', text: 'Impossible de supprimer une session terminée!' });
      return;
    }
    if (!window.confirm('Voulez-vous vraiment supprimer cette session et tous ses tests?')) return;
    try {
      await testSessionsAPI.delete(id);
      setMessage({ type: 'success', text: 'Session supprimée!' });
      fetchSessions();
      if (selectedSession === id) {
        setSelectedSession(null);
        setView('sessions');
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' });
    }
  };

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Filter out 0/empty values for optional fields and prepare data
      const testData: Partial<Test> = {};
      
      if (formData.sessionId) testData.sessionId = formData.sessionId;
      if (formData.applicationId) testData.applicationId = formData.applicationId;
      if (formData.fonction) testData.fonction = formData.fonction;
      if (formData.precondition) testData.precondition = formData.precondition;
      if (formData.etapes) testData.etapes = formData.etapes;
      if (formData.resultatAttendu) testData.resultatAttendu = formData.resultatAttendu;
      if (formData.resultatObtenu) testData.resultatObtenu = formData.resultatObtenu;
      if (formData.statut) testData.statut = formData.statut;
      if (formData.commentaires) testData.commentaires = formData.commentaires;
      if (formData.image) testData.image = formData.image;
      
      await testsAPI.create(testData);
      setMessage({ type: 'success', text: 'Test ajouté avec succès!' });
      // Réinitialiser tous les champs du formulaire après la soumission
      setFormData({
        sessionId: 0,
        applicationId: 0,
        fonction: '',
        precondition: '',
        etapes: '',
        resultatAttendu: '',
        resultatObtenu: '',
        statut: '',
        commentaires: '',
        image: ''
      });
      setImagePreview(null);
      setShowTestForm(false);
      fetchData();
      fetchSessions();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string | unknown[] } } };
      const detail = error.response?.data?.detail;
      let errorText = 'Erreur lors de l\'ajout';
      if (typeof detail === 'string') {
        errorText = detail;
      } else if (Array.isArray(detail)) {
        errorText = (detail as unknown[]).map((e: unknown) => {
          const err = e as { msg?: string };
          return err.msg || JSON.stringify(e);
        }).join(', ');
      }
      setMessage({ type: 'error', text: errorText });
    }
  };

  const handleDeleteTest = async (id: number) => {
    if (!window.confirm('Voulez-vous supprimer ce test?')) return;
    try {
      await testsAPI.delete(id);
      setMessage({ type: 'success', text: 'Test supprimé!' });
      fetchData();
      fetchSessions();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string | unknown[] } } };
      const detail = error.response?.data?.detail;
      let errorText = 'Erreur';
      if (typeof detail === 'string') {
        errorText = detail;
      } else if (Array.isArray(detail)) {
        errorText = (detail as unknown[]).map((e: unknown) => {
          const err = e as { msg?: string };
          return err.msg || JSON.stringify(e);
        }).join(', ');
      }
      setMessage({ type: 'error', text: errorText });
    }
  };

  const handleEditTest = (test: Test) => {
    setEditingTest(test);
    setFormData({
      sessionId: test.sessionId || 0,
      applicationId: test.applicationId || 0,
      fonction: test.fonction,
      precondition: test.precondition,
      etapes: test.etapes,
      resultatAttendu: test.resultatAttendu,
      resultatObtenu: test.resultatObtenu,
      statut: test.statut,
      commentaires: test.commentaires,
      image: test.image || ''
    });
    setImagePreview(test.image || null);
    setShowEditModal(true);
  };

  const openEditSessionModal = (session: TestSession) => {
    setEditingSession(session);
    setEditSessionForm({
      nom: session.nom,
      description: session.description || '',
      applicationId: session.applicationId || 0,
      environnement: session.environnement || '',
      version: session.version || '',
      nom_document: session.nom_document || '',
      statut: session.statut || 'En cours'
    });
    setShowEditSessionModal(true);
  };

  const handleUpdateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;

    try {
      const sessionData = {
        nom: editSessionForm.nom,
        description: editSessionForm.description,
        applicationId: editSessionForm.applicationId || undefined,
        environnement: editSessionForm.environnement || undefined,
        version: editSessionForm.version || undefined,
        nom_document: editSessionForm.nom_document || undefined,
        statut: editSessionForm.statut
      };
      await testSessionsAPI.update(editingSession.id, sessionData);
      setMessage({ type: 'success', text: 'Session mise à jour!' });
      setShowEditSessionModal(false);
      setEditingSession(null);
      fetchSessions();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Erreur lors de la mise à jour' });
    }
  };

  const handleGenerateTestWord = async (test: Test) => {
    try {
      console.log('Début de la génération Word pour le test:', test);
      // Créer un vrai document Word avec la librairie docx
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "RAPPORT DE TEST INDIVIDUEL",
                  bold: true,
                  size: 32
                })
              ],
              alignment: AlignmentType.CENTER
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "============================",
                  bold: true,
                  size: 24
                })
              ],
              alignment: AlignmentType.CENTER
            }),
            new Paragraph({ text: "" }), // Espace
            new Paragraph({
              children: [
                new TextRun({
                  text: "INFORMATIONS GÉNÉRALES",
                  bold: true,
                  size: 24
                })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "-------------------",
                  bold: true
                })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `ID du test: ${test.id}` })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Fonction: ${test.fonction || 'Non spécifiée'}` })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Précondition: ${test.precondition || 'Non spécifiée'}` })
              ]
            }),
            new Paragraph({ text: "" }), // Espace
            new Paragraph({
              children: [
                new TextRun({
                  text: "DÉTAILS DU TEST",
                  bold: true,
                  size: 24
                })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "---------------",
                  bold: true
                })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Étapes: ${test.etapes || 'Non spécifiées'}` })
              ]
            }),
            new Paragraph({ text: "" }), // Espace
            new Paragraph({
              children: [
                new TextRun({
                  text: "RÉSULTATS",
                  bold: true,
                  size: 24
                })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "----------",
                  bold: true
                })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Résultat attendu: ${test.resultatAttendu || 'Non spécifié'}` })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Résultat obtenu: ${test.resultatObtenu || 'Non spécifié'}` })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Statut: ${test.statut || 'Non spécifié'}` })
              ]
            }),
            new Paragraph({ text: "" }), // Espace
            new Paragraph({
              children: [
                new TextRun({
                  text: "COMMENTAIRES",
                  bold: true,
                  size: 24
                })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "------------",
                  bold: true
                })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: test.commentaires || 'Aucun commentaire' })
              ]
            }),
            new Paragraph({ text: "" }), // Espace
            new Paragraph({
              children: [
                new TextRun({
                  text: "MÉTADONNÉES",
                  bold: true,
                  size: 24
                })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "------------",
                  bold: true
                })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Date de génération: ${new Date().toLocaleDateString('fr-FR')}` })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Heure de génération: ${new Date().toLocaleTimeString('fr-FR')}` })
              ]
            }),
            new Paragraph({ text: "" }), // Espace
            new Paragraph({
              children: [
                new TextRun({
                  text: "STATUT",
                  bold: true,
                  size: 24
                })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "------",
                  bold: true
                })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Ce document a été généré automatiquement par IT Access Manager" })
              ]
            })
          ]
        }]
      });

      // Générer le blob et télécharger
      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Test_${test.id}_${test.fonction || 'test'}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setMessage({ type: 'success', text: 'Document Word généré avec succès!' });
    } catch (err) {
      console.error('Erreur détaillée lors de la génération Word:', err);
      setMessage({ type: 'error', text: 'Erreur lors de la génération du document Word' });
    }
  };

  const handleUpdateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTest) return;
    
    try {
      const testData: Partial<Test> = {};
      
      if (formData.sessionId) testData.sessionId = formData.sessionId;
      if (formData.applicationId) testData.applicationId = formData.applicationId;
      if (formData.fonction) testData.fonction = formData.fonction;
      if (formData.precondition) testData.precondition = formData.precondition;
      if (formData.etapes) testData.etapes = formData.etapes;
      if (formData.resultatAttendu) testData.resultatAttendu = formData.resultatAttendu;
      if (formData.resultatObtenu) testData.resultatObtenu = formData.resultatObtenu;
      if (formData.statut) testData.statut = formData.statut;
      if (formData.commentaires) testData.commentaires = formData.commentaires;
      if (formData.image) testData.image = formData.image;
      
      await testsAPI.update(editingTest.id, testData);
      setMessage({ type: 'success', text: 'Test modifié avec succès!' });
      setShowEditModal(false);
      setEditingTest(null);
      setImagePreview(null);
      setFormData({
        sessionId: 0,
        applicationId: 0,
        fonction: '',
        precondition: '',
        etapes: '',
        resultatAttendu: '',
        resultatObtenu: '',
        statut: '',
        commentaires: '',
        image: ''
      });
      fetchData();
      fetchSessions();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string | unknown[] } } };
      const detail = error.response?.data?.detail;
      let errorText = 'Erreur lors de la modification';
      if (typeof detail === 'string') {
        errorText = detail;
      } else if (Array.isArray(detail)) {
        errorText = (detail as unknown[]).map((e: unknown) => {
          const err = e as { msg?: string };
          return err.msg || JSON.stringify(e);
        }).join(', ');
      }
      setMessage({ type: 'error', text: errorText });
    }
  };

  const getSessionTests = (sessionId: number) => {
    // Vérifier si c'est une session consolidée
    const tempConsolidated = (window as any).tempConsolidatedSession;
    if (tempConsolidated && tempConsolidated.id === sessionId) {
      return tempConsolidated.tests || [];
    }
    
    // Sinon, retourner les tests normaux
    return tests.filter(t => t.sessionId === sessionId);
  };

  const handleExportSessionWord = async (session: TestSession) => {
    try {
      const sessionTests = getSessionTests(session.id);
      const today = new Date();
      const formattedDate = today.toLocaleDateString('fr-FR', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      });

      // Créer les lignes du tableau pour les tests
      const tableRows = [
        // En-tête du tableau
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "ID", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Fonction", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Précondition", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Étapes", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Résultat Attendu", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Résultat Obtenu", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Statut", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Commentaires", bold: true })] })] })
          ]
        })
      ];

      // Ajouter chaque test comme une ligne du tableau
      sessionTests.forEach((test: Test) => {
        tableRows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${test.id}` })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: test.fonction || '-' })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: test.precondition || '-' })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: test.etapes || '-' })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: test.resultatAttendu || '-' })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: test.resultatObtenu || '-' })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: test.statut || '-' })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: test.commentaires || '-' })] })] })
            ]
          })
        );
      });

      // Créer le document Word avec le même format que le PDF
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // En-tête
            new Paragraph({
              children: [
                new TextRun({
                  text: session.applicationNom || session.nom,
                  bold: true,
                  size: 32
                })
              ],
              alignment: AlignmentType.CENTER
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: session.nom ? `Session: ${session.nom}` : '',
                  italics: true,
                  size: 20
                })
              ],
              alignment: AlignmentType.CENTER
            }),
            new Paragraph({ text: "" }), // Espace
            
            // Informations de la session
            new Paragraph({
              children: [
                new TextRun({ text: `Date: ${formattedDate}` }),
                new TextRun({ text: "\t" }),
                new TextRun({ text: `Environnement: ${session.environnement || '-'}` }),
                new TextRun({ text: "\t" }),
                new TextRun({ text: `Version: ${session.version || '-'}` }),
                new TextRun({ text: "\t" }),
                new TextRun({ text: `Statut: ${session.statut}` })
              ],
              alignment: AlignmentType.CENTER
            }),
            new Paragraph({ text: "" }), // Espace
            
            // Statistiques
            new Paragraph({
              children: [
                new TextRun({ text: `Total: ${sessionTests.length}` }),
                new TextRun({ text: "\t" }),
                new TextRun({ text: `OK: ${sessionTests.filter((t: Test) => t.statut === 'OK').length}` }),
                new TextRun({ text: "\t" }),
                new TextRun({ text: `BUG: ${sessionTests.filter((t: Test) => t.statut === 'BUG').length}` }),
                new TextRun({ text: "\t" }),
                new TextRun({ text: `EN COURS: ${sessionTests.filter((t: Test) => t.statut === 'EN COURS').length}` })
              ],
              alignment: AlignmentType.CENTER
            }),
            new Paragraph({ text: "" }), // Espace
            
            // Tableau des tests
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: tableRows
            }),
            new Paragraph({ text: "" }), // Espace
            
            // Pied de page
            new Paragraph({
              children: [
                new TextRun({ text: "IT Access Manager - Document de test" })
              ],
              alignment: AlignmentType.CENTER
            })
          ]
        }]
      });

      // Générer le blob et télécharger
      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Rapport_Tests_${session.nom.replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setMessage({ type: 'success', text: 'Document Word généré avec succès!' });
    } catch (err) {
      console.error('Erreur détaillée lors de la génération Word session:', err);
      setMessage({ type: 'error', text: 'Erreur lors de la génération du document Word' });
    }
  };

  const handleExportSessionPDF = (session: TestSession) => {
    const sessionTests = getSessionTests(session.id);
    const today = new Date();
    const formattedDate = today.toLocaleDateString('fr-FR', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${session.applicationNom || session.nom}</title>
        <style>
          @page { 
            size: A4 landscape;
            margin: 15mm; 
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { height: auto; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #333; font-size: 14px; line-height: 1.4; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #2c3e50; padding-bottom: 12px; page-break-after: avoid; }
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
          table { width: 100%; border-collapse: collapse; font-size: 14px; page-break-inside: auto; }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          th { background: #2c3e50; color: white; padding: 8px 6px; text-align: left; font-size: 12px; }
          td { padding: 8px 6px; border-bottom: 1px solid #ddd; vertical-align: top; font-size: 11px; }
          tr:nth-child(even) { background: #f8f9fa; }
          .statut-ok { background: #27ae60; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; }
          .statut-bug { background: #e74c3c; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; }
          .statut-en-cours { background: #f39c12; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; }
          .statut-bloque { background: #6c757d; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; }
          .footer { margin-top: 15px; text-align: center; color: #7f8c8d; font-size: 10px; border-top: 1px solid #ddd; padding-top: 8px; page-break-before: avoid; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${session.applicationNom || session.nom}</h1>
          ${session.nom ? `<div class="session-name">Session: ${session.nom}</div>` : ''}
          <div class="session-info">
            <div class="info-item">
              <div class="info-label">Date</div>
              <div class="info-value">${formattedDate}</div>
            </div>
            ${session.environnement ? `<div class="info-item"><div class="info-label">Environnement</div><div class="info-value">${session.environnement}</div></div>` : ''}
            ${session.version ? `<div class="info-item"><div class="info-label">Version</div><div class="info-value">${session.version}</div></div>` : ''}
            <div class="info-item">
              <div class="info-label">Statut</div>
              <div class="info-value">${session.statut}</div>
            </div>
          </div>
        </div>
        <div class="stats">
          <div class="stat-box stat-total"><strong>${sessionTests.length}</strong><br/>Total</div>
          <div class="stat-box stat-ok"><strong>${sessionTests.filter((t: Test) => t.statut === 'OK').length}</strong><br/>OK</div>
          <div class="stat-box stat-bug"><strong>${sessionTests.filter((t: Test) => t.statut === 'BUG').length}</strong><br/>BUG</div>
          <div class="stat-box stat-en-cours"><strong>${sessionTests.filter((t: Test) => t.statut === 'EN COURS').length}</strong><br/>En Cours</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Fonction</th>
              <th>Précondition</th>
              <th>Étapes</th>
              <th>Résultat Attendu</th>
              <th>Résultat Obtenu</th>
              <th>Statut</th>
              <th>Commentaires</th>
            </tr>
          </thead>
          <tbody>
            ${sessionTests.map((test: Test) => `
              <tr>
                <td>${test.id}</td>
                <td>${test.fonction || '-'}</td>
                <td>${test.precondition || '-'}</td>
                <td>${test.etapes || '-'}</td>
                <td>${test.resultatAttendu || '-'}</td>
                <td>${test.resultatObtenu || '-'}</td>
                <td><span class="statut-${test.statut.toLowerCase().replace(' ', '-')}">${test.statut}</span></td>
                <td>${test.commentaires || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
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

   // Render Sessions List
   const renderSessions = () => (
     <div>
       <div className="tests-sessions-header">
         <div className="tests-header-left">
           {isAdmin && (
             <div className="tests-user-filter">
               <label className="tests-filter-label">Filtrer par utilisateur:</label>
               <select 
                 value={selectedUser || ''} 
                 onChange={(e) => setSelectedUser(e.target.value ? Number(e.target.value) : null)}
                 className="tests-filter-select"
               >
                 <option value="">Tous les utilisateurs</option>
                 {(() => {
                   console.log('Rendering users filter, users:', users);
                   console.log('Users length:', users?.length);
                   console.log('Is users array?', Array.isArray(users));
                   
                   // Test avec des données factices si le tableau est vide
                   const usersToRender = Array.isArray(users) && users.length > 0 ? users : [
                     { id: 1, username: 'Test User 1' },
                     { id: 2, username: 'Test User 2' }
                   ];
                   
                   return usersToRender.map(user => (
                     <option key={user.id} value={user.id}>{user.username}</option>
                   ));
                 })()}
               </select>
             </div>
           )}
         </div>
         <div className="tests-header-right">
           {isAdmin && (
             <div className="tests-consolidation-buttons">
               {consolidationMode === 'none' ? (
                 <>
                   <button 
                     className={`tests-consolidation-button ${selectionMode ? 'tests-consolidation-button-active' : ''}`}
                     onClick={handleToggleSelectionMode}
                     title={selectionMode ? "Arrêter la sélection" : "Sélectionner des sessions"}
                   >
                     <FontAwesomeIcon icon={faCompress} />
                   </button>
                   {selectionMode && (
                     <>
                       <button 
                         className="tests-consolidation-button"
                         onClick={handleSelectAllSessions}
                         title="Tout sélectionner"
                       >
                         Tout
                       </button>
                       <button 
                         className="tests-consolidation-button"
                         onClick={handleClearSelection}
                         title="Effacer la sélection"
                       >
                         Effacer
                       </button>
                       <span className="tests-selection-info">
                         {selectedSessions.length} session(s) sélectionnée(s)
                       </span>
                     </>
                   )}
                   <button 
                     className="tests-consolidation-button"
                     onClick={handleConsolidateByUser}
                     title="Consolider par utilisateur"
                     disabled={selectionMode && selectedSessions.length === 0}
                   >
                     <FontAwesomeIcon icon={faCompress} />
                   </button>
                   <button 
                     className="tests-consolidation-button"
                     onClick={handleConsolidateGlobal}
                     title="Consolider globalement"
                     disabled={selectionMode && selectedSessions.length === 0}
                   >
                     <FontAwesomeIcon icon={faCompress} />
                   </button>
                 </>
               ) : (
                 <button 
                   className="tests-reset-button"
                   onClick={handleResetConsolidation}
                   title="Réinitialiser la consolidation"
                 >
                   <FontAwesomeIcon icon={faExpand} />
                 </button>
               )}
             </div>
            )}
          </div>
        </div>
      <div className="tests-sessions-grid">
        {consolidationMode !== 'none' ? (
          consolidatedSessions.map(consolidated => (
            <div key={consolidated.id} className="tests-session-card tests-session-card-consolidated">
              <div className="tests-session-header">
                <h3 className="tests-session-title">{consolidated.nom}</h3>
                <span className="tests-status-badge" style={{ backgroundColor: getStatusColor(consolidated.statut) }}>
                  {consolidated.statut}
                </span>
              </div>
              <p className="tests-session-description">{consolidated.description}</p>
              <div className="tests-session-meta">
                <span><strong>Utilisateur:</strong> {consolidated.username}</span>
                <span><strong>Tests:</strong> {consolidated.total_tests}</span>
                <span><strong>OK:</strong> {consolidated.tests_ok}</span>
                <span><strong>BUG:</strong> {consolidated.tests_bug}</span>
                <span><strong>En cours:</strong> {consolidated.tests_en_cours}</span>
              </div>
              <div className="tests-session-meta">
                <span><strong>Sessions originales:</strong> {consolidated.originalSessions.length}</span>
                <span><strong>Créé le:</strong> {new Date(consolidated.date_creation).toLocaleDateString()}</span>
              </div>
              <div className="tests-session-actions">
                <button 
                  className="tests-view-button"
                  onClick={() => handleViewConsolidatedSession(consolidated)}
                  title="Voir les détails"
                >
                  <FontAwesomeIcon icon={faEye} />
                </button>
                <button 
                  className="tests-export-button"
                  onClick={() => handleExportConsolidatedPDF(consolidated)}
                  title="Exporter en PDF"
                >
                  <FontAwesomeIcon icon={faFilePdf} />
                </button>
                <button 
                  className="tests-export-button"
                  onClick={() => handleExportConsolidatedWord(consolidated)}
                  title="Exporter en Word"
                >
                  <FontAwesomeIcon icon={faFileWord} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className={window.innerWidth <= 768 ? 'tests-sessions-grid' : 'tests-sessions-grid-desktop'}>
            {sessions.map((session) => (
            <div key={session.id} className={`tests-session-card ${selectionMode && selectedSessions.includes(session.id) ? 'tests-session-card-selected' : ''} ${selectionMode ? 'tests-session-card-selectable' : ''}`}>
              {selectionMode && (
                <div className="tests-selection-checkbox">
                  <input 
                    type="checkbox"
                    checked={selectedSessions.includes(session.id)}
                    onChange={() => handleToggleSessionSelection(session.id)}
                    className="tests-checkbox"
                  />
                </div>
              )}
              <div className="tests-session-header">
                <h3 className="tests-session-title">{session.nom}</h3>
                <span className="tests-status-badge" style={{ backgroundColor: getStatusColor(session.statut) }}>
                  {session.statut}
                </span>
              </div>
              {session.createdByUsername && (
                <p className="tests-session-owner"><i className="fas fa-user"></i> Créé par: {session.createdByUsername}</p>
              )}
              <p className="tests-session-desc">{session.description || 'Aucune description'}</p>
              {session.nom_document && (
                <p className="tests-session-info"><i className="fas fa-file"></i> Document: {session.nom_document}</p>
              )}
              <div className="tests-session-stats">
                <span>Total: {getSessionTests(session.id).length}</span>
                <span className="tests-stat-ok"><FontAwesomeIcon icon={faCheck} /> {getSessionTests(session.id).filter((t: Test) => t.statut === 'OK').length}</span>
                <span className="tests-stat-bug"><FontAwesomeIcon icon={faTimes} /> {getSessionTests(session.id).filter((t: Test) => t.statut === 'BUG').length}</span>
              </div>
               <div className="tests-session-actions">
                 <button 
                   className="tests-view-button"
                   onClick={() => {
                     setSelectedSession(session.id);
                     setView('tests');
                   }}
                 >
                   <FontAwesomeIcon icon={faEye} />
                 </button>
                 <button 
                   className="tests-edit-button"
                   onClick={() => openEditSessionModal(session)}
                   title="Modifier la session"
                   disabled={session.statut === 'Terminé'}
                 >
                   <FontAwesomeIcon icon={faEdit} />
                 </button>
                 <button 
                   className="tests-export-button"
                   onClick={() => {
                     handleExportSessionPDF(session);
                   }}
                 >
                   <FontAwesomeIcon icon={faFilePdf} />
                 </button>
                 <button 
                   className="tests-export-button"
                   onClick={() => {
                     handleExportSessionWord(session);
                   }}
                 >
                   <FontAwesomeIcon icon={faFileWord} />
                 </button>
                 {session.statut !== 'Terminé' && (
                  <button 
                    className="tests-delete-button tests-delete-button-outline"
                    onClick={() => {
                      handleDeleteSession(session.id);
                    }} 
                    title="Supprimer"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );

  
  
  // Render Tests for selected session
  const renderTests = () => {
    const sessionTests = selectedSession ? getSessionTests(selectedSession) : tests;
    const currentSession = sessions.find(s => s.id === selectedSession);
    
    return (
      <div>
        <button className="tests-back-button" onClick={() => { setSelectedSession(null); setView('sessions'); }}>
          <i className="fas fa-arrow-left"></i> Retour aux sessions
        </button>
        
        {currentSession && (
          <div className="tests-current-session-info">
            <h3><i className="fas fa-file-alt"></i> {currentSession.nom}</h3>
            <p>{currentSession.description}</p>
            {currentSession.nom_document && <p className="tests-session-info"><i className="fas fa-file"></i> Document: {currentSession.nom_document}</p>}
          </div>
        )}

        <div className="tests-form-section">
          <button 
            className="tests-add-test-button"
            onClick={() => {
              // Pré-remplir le formulaire avec les infos de la session
              const currentSession = sessions.find(s => s.id === selectedSession);
              if (currentSession) {
                setFormData({
                  sessionId: selectedSession || 0,
                  applicationId: currentSession.applicationId || 0,
                  fonction: '',
                  precondition: '',
                  etapes: '',
                  resultatAttendu: '',
                  resultatObtenu: '',
                  statut: '',
                  commentaires: '',
                  image: ''
                });
              }
              setShowTestForm(true);
            }}
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
        </div>

        <div className="tests-table-section">
          <div className="tests-tests-header">
            <div>
              <h3 className="tests-section-title">Tests de la session</h3>
              <p className="tests-tests-subtitle">
                {sessionTests.length === 0
                  ? 'Aucun test enregistré pour cette session.'
                  : `${sessionTests.length} test${sessionTests.length > 1 ? 's' : ''} au total.`}
              </p>
            </div>
          </div>
          
          {/* Affichage en fonction de la taille d'écran */}
          {isMobile ? (
            /* Affichage en cartes pour mobile */
            <div className="tests-mobile-cards">
            {sessionTests.map((test: Test) => (
              <div key={test.id} className="tests-test-card" style={{ border: `2px solid ${getStatusColor(test.statut)}` }}>
                <div className="tests-session-header">
                  <h4 className="tests-test-title">
                    {test.fonction || 'Test sans fonction'}
                  </h4>
                  <span className="tests-status-badge" style={{ backgroundColor: getStatusColor(test.statut) }}>
                    {test.statut}
                  </span>
                </div>
                
                <div className="tests-test-field">
                  <strong>Précondition:</strong> {test.precondition || '-'}
                </div>
                
                <div className="tests-test-field">
                  <strong>Étapes:</strong> 
                  <div className="tests-test-field-value">
                    {test.etapes || '-'}
                  </div>
                </div>
                
                <div className="tests-test-field">
                  <strong>Résultat Attendu:</strong>
                  <div className="tests-test-field-value">
                    {test.resultatAttendu || '-'}
                  </div>
                </div>
                
                <div className="tests-test-field">
                  <strong>Résultat Obtenu:</strong>
                  <div className="tests-test-field-value">
                    {test.resultatObtenu || '-'}
                  </div>
                </div>
                
                {test.commentaires && (
                  <div className="tests-test-field">
                    <strong>Commentaires:</strong>
                    <div className="tests-test-field-value">
                      {test.commentaires}
                    </div>
                  </div>
                )}
                
                <div className="tests-session-actions">
                  <button className="tests-edit-button tests-edit-button-compact" onClick={() => handleGenerateTestWord(test)} title="Générer Word">
                    <FontAwesomeIcon icon={faFileWord} />
                  </button>
                  <button className="tests-edit-button tests-edit-button-compact" onClick={() => handleEditTest(test)} title="Modifier">
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button className="tests-delete-button tests-delete-button-compact" onClick={() => handleDeleteTest(test.id)} title="Supprimer">
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          ) : (
            /* Affichage en tableau pour web/desktop */
            <div className="tests-table-container">
              <table className="tests-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Fonction</th>
                    <th>Précondition</th>
                    <th>Étapes</th>
                    <th>Résultat Attendu</th>
                    <th>Résultat Obtenu</th>
                    <th>Statut</th>
                    <th>Commentaires</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionTests.map((test: Test) => (
                    <tr key={test.id}>
                      <td>{test.id}</td>
                      <td>{test.fonction || '-'}</td>
                      <td>{test.precondition ? (test.precondition.length > 50 ? test.precondition.substring(0, 50) + '...' : test.precondition) : '-'}</td>
                      <td>{test.etapes ? (test.etapes.length > 50 ? test.etapes.substring(0, 50) + '...' : test.etapes) : '-'}</td>
                      <td>{test.resultatAttendu ? (test.resultatAttendu.length > 50 ? test.resultatAttendu.substring(0, 50) + '...' : test.resultatAttendu) : '-'}</td>
                      <td>{test.resultatObtenu ? (test.resultatObtenu.length > 50 ? test.resultatObtenu.substring(0, 50) + '...' : test.resultatObtenu) : '-'}</td>
                      <td>
                        <span className="tests-status-badge" style={{ backgroundColor: getStatusColor(test.statut) }}>
                          {test.statut}
                        </span>
                      </td>
                      <td>{test.commentaires ? (test.commentaires.length > 30 ? test.commentaires.substring(0, 30) + '...' : test.commentaires) : '-'}</td>
                      <td className="tests-table-actions">
                        <button 
                          className="tests-edit-button"
                          onClick={() => handleEditTest(test)}
                          title="Modifier"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button 
                          className="tests-export-button"
                          onClick={() => handleGenerateTestWord(test)}
                          title="Exporter en Word"
                        >
                          <FontAwesomeIcon icon={faFileWord} />
                        </button>
                        <button 
                          className="tests-delete-button tests-delete-button-outline"
                          onClick={() => handleDeleteTest(test.id)}
                          title="Supprimer"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

   return (
     <div className="tests-container">
       <main className="tests-main">
         <div className="tests-sessions-header">
           <div>
             <h2 className="tests-page-title"><i className="fas fa-vial"></i> {isAdmin ? 'Gestion des Tests' : 'Mes Sessions de Test'}</h2>
             <p className="tests-page-subtitle">{isAdmin ? 'Documents de Test - Planification et suivi des tests' : 'Vos sessions de test personnelles'}</p>
           </div>
           <button
             className="tests-new-session-button"
             onClick={() => setShowSessionModal(true)}
             title="Créer une nouvelle session"
           >
             <FontAwesomeIcon icon={faPlus} />
             Nouvelle session
           </button>
         </div>
        
        {message.text && (
          <div className={message.type === 'success' ? 'tests-success' : 'tests-error'}>
            <i className={message.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'}></i>
            {message.text}
          </div>
        )}

        {view === 'sessions' ? renderSessions() : renderTests()}
      </main>

      {showSessionModal && (
        <div className="tests-modal">
          <div className="tests-modal-content tests-session-modal-content">
            <span className="tests-close" onClick={() => setShowSessionModal(false)}>&times;</span>
            <div className="tests-modal-header">
              <h3 className="tests-section-title">Nouvelle session</h3>
              <p className="tests-modal-subtitle">
                Créez une session pour regrouper vos cas de test et générer un export PDF.
              </p>
            </div>
             <form onSubmit={handleCreateSession} className="tests-session-form">
               <div className="tests-form-row">
                 <div className="tests-form-group">
                   <label className="tests-label">Nom de la session *</label>
                   <input
                     type="text"
                     value={sessionForm.nom}
                     onChange={(e) => setSessionForm({ ...sessionForm, nom: e.target.value })}
                     className="tests-session-modal-input"
                     required
                     placeholder="Ex: Test Release v1.0"
                   />
                 </div>
                 <div className="tests-form-group">
                   <label className="tests-label">Application</label>
                   <select
                     value={sessionForm.applicationId || ''}
                     onChange={(e) => setSessionForm({ ...sessionForm, applicationId: Number(e.target.value) })}
                     className="tests-session-modal-select"
                   >
                     <option value="">Sélectionner une application</option>
                     {applications.map((app) => (
                       <option key={app.id} value={app.id}>{app.nom}</option>
                     ))}
                   </select>
                 </div>
               </div>
               <div className="tests-form-row">
                 <div className="tests-form-group">
                   <label className="tests-label">Environnement</label>
                   <input
                     type="text"
                     value={sessionForm.environnement}
                     onChange={(e) => setSessionForm({ ...sessionForm, environnement: e.target.value })}
                     className="tests-session-modal-input"
                     placeholder="Ex: Production, Recette..."
                   />
                 </div>
                 <div className="tests-form-group">
                   <label className="tests-label">Version</label>
                   <input
                     type="text"
                     value={sessionForm.version}
                     onChange={(e) => setSessionForm({ ...sessionForm, version: e.target.value })}
                     className="tests-session-modal-input"
                     placeholder="Ex: v1.0.0"
                   />
                 </div>
               </div>
               <div className="tests-form-group">
                 <label className="tests-label">Nom du document</label>
                 <input
                   type="text"
                   value={sessionForm.nom_document}
                   onChange={(e) => setSessionForm({ ...sessionForm, nom_document: e.target.value })}
                   className="tests-session-modal-input"
                   placeholder="Ex: Plan de Test - Application X"
                 />
               </div>
               <div className="tests-form-group">
                 <label className="tests-label">Description</label>
                 <textarea
                   value={sessionForm.description}
                   onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })}
                   className="tests-session-modal-textarea"
                   placeholder="Description de la session..."
                   rows={3}
                 />
               </div>
              <div className="tests-form-actions">
                <button type="button" className="tests-cancel-button" onClick={() => setShowSessionModal(false)}>Annuler</button>
                <button type="submit" className="tests-submit-button">Créer</button>
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="tests-secondary-button"
                >
                  Annuler
                </button>
                <button type="submit" className="tests-primary-button">
                  Créer la session
                </button>
              </div>
            </form>
          </div>
        </div>
       )}

       {showEditSessionModal && (
         <div className="tests-modal">
           <div className="tests-modal-content tests-session-modal-content">
             <span className="tests-close" onClick={() => setShowEditSessionModal(false)}>&times;</span>
             <div className="tests-modal-header">
               <h3 className="tests-section-title">Modifier la session</h3>
               <p className="tests-modal-subtitle">
                 Modifiez les informations de la session.
               </p>
             </div>
             <form onSubmit={handleUpdateSession} className="tests-session-form">
               <div className="tests-form-row">
                 <div className="tests-form-group">
                   <label className="tests-label">Nom de la session *</label>
                   <input
                     type="text"
                     value={editSessionForm.nom}
                     onChange={(e) => setEditSessionForm({ ...editSessionForm, nom: e.target.value })}
                     className="tests-session-modal-input"
                     required
                     placeholder="Ex: Test Release v1.0"
                   />
                 </div>
                 <div className="tests-form-group">
                   <label className="tests-label">Application</label>
                   <select
                     value={editSessionForm.applicationId || ''}
                     onChange={(e) => setEditSessionForm({ ...editSessionForm, applicationId: Number(e.target.value) })}
                     className="tests-session-modal-select"
                   >
                     <option value="">Sélectionner une application</option>
                     {applications.map((app) => (
                       <option key={app.id} value={app.id}>{app.nom}</option>
                     ))}
                   </select>
                 </div>
               </div>
               <div className="tests-form-row">
                 <div className="tests-form-group">
                   <label className="tests-label">Nom du document de test</label>
                   <input
                     type="text"
                     value={editSessionForm.nom_document}
                     onChange={(e) => setEditSessionForm({ ...editSessionForm, nom_document: e.target.value })}
                     className="tests-session-modal-input"
                     placeholder="Ex: Plan de tests v1.0"
                   />
                 </div>
                 <div className="tests-form-group">
                   <label className="tests-label">Statut</label>
                   <select
                     value={editSessionForm.statut}
                     onChange={(e) => setEditSessionForm({ ...editSessionForm, statut: e.target.value })}
                     className="tests-session-modal-select"
                   >
                     <option value="En cours">En cours</option>
                     <option value="Terminé">Terminé</option>
                     <option value="Bloquée">Bloquée</option>
                   </select>
                 </div>
               </div>
               <div className="tests-form-row">
                 <div className="tests-form-group">
                   <label className="tests-label">Environnement</label>
                   <input
                     type="text"
                     value={editSessionForm.environnement}
                     onChange={(e) => setEditSessionForm({ ...editSessionForm, environnement: e.target.value })}
                     className="tests-session-modal-input"
                     placeholder="Ex: Production"
                   />
                 </div>
                 <div className="tests-form-group">
                   <label className="tests-label">Version</label>
                   <input
                     type="text"
                     value={editSessionForm.version}
                     onChange={(e) => setEditSessionForm({ ...editSessionForm, version: e.target.value })}
                     className="tests-session-modal-input"
                     placeholder="Ex: 1.0.0"
                   />
                 </div>
               </div>
               <div className="tests-form-group">
                 <label className="tests-label">Description</label>
                 <textarea
                   value={editSessionForm.description}
                   onChange={(e) => setEditSessionForm({ ...editSessionForm, description: e.target.value })}
                   className="tests-session-modal-textarea"
                   placeholder="Description de la session de test..."
                 />
               </div>
               <div className="tests-form-actions">
                 <button
                   type="button"
                   onClick={() => setShowEditSessionModal(false)}
                   className="tests-secondary-button"
                 >
                   Annuler
                 </button>
                 <button type="submit" className="tests-primary-button">
                   Enregistrer
                 </button>
               </div>
             </form>
           </div>
         </div>
       )}

       {showTestForm && (
        <div className="tests-modal">
          <div className="tests-modal-content tests-test-modal-content">
            <span className="tests-close" onClick={() => setShowTestForm(false)}>&times;</span>
            <div className="tests-modal-header">
              <h3 className="tests-section-title">Nouveau test</h3>
            </div>
            <form onSubmit={handleSubmit} className="tests-test-form">
              <div className="tests-form-row">
                <div className="tests-form-group">
                  <label className="tests-label">Fonction *</label>
                  <input
                    type="text"
                    placeholder="Fonction"
                    value={formData.fonction}
                    onChange={(e) => setFormData({ ...formData, fonction: e.target.value })}
                    className="tests-input"
                    required
                  />
                </div>
                <div className="tests-form-group">
                  <label className="tests-label">Statut *</label>
                  <select
                    value={formData.statut}
                    onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                    className="tests-select"
                    required
                  >
                    <option value="">Sélectionner...</option>
                    <option value="OK">OK</option>
                    <option value="BUG">BUG</option>
                    <option value="EN COURS">EN COURS</option>
                    <option value="BLOQUE">BLOQUE</option>
                  </select>
                </div>
              </div>
              <div className="tests-form-row">
                <div className="tests-form-group">
                  <label className="tests-label">Précondition</label>
                  <textarea
                    placeholder="Précondition"
                    value={formData.precondition}
                    onChange={(e) => setFormData({ ...formData, precondition: e.target.value })}
                    className="tests-textarea"
                  />
                </div>
                <div className="tests-form-group">
                  <label className="tests-label">Étapes</label>
                  <textarea
                    placeholder="Étapes"
                    value={formData.etapes}
                    onChange={(e) => setFormData({ ...formData, etapes: e.target.value })}
                    className="tests-textarea"
                  />
                </div>
              </div>
              <div className="tests-form-row">
                <div className="tests-form-group">
                  <label className="tests-label">Résultat attendu</label>
                  <textarea
                    placeholder="Résultat Attendu"
                    value={formData.resultatAttendu}
                    onChange={(e) => setFormData({ ...formData, resultatAttendu: e.target.value })}
                    className="tests-textarea"
                  />
                </div>
                <div className="tests-form-group">
                  <label className="tests-label">Résultat obtenu</label>
                  <textarea
                    placeholder="Résultat Obtenu"
                    value={formData.resultatObtenu}
                    onChange={(e) => setFormData({ ...formData, resultatObtenu: e.target.value })}
                    className="tests-textarea"
                  />
                </div>
              </div>
              <div className="tests-form-group">
                <label className="tests-label">Commentaires</label>
                <textarea
                  placeholder="Commentaires"
                  value={formData.commentaires}
                  onChange={(e) => setFormData({ ...formData, commentaires: e.target.value })}
                  className="tests-textarea"
                />
              </div>
              <div className="tests-form-actions">
                <button
                  type="button"
                  onClick={() => setShowTestForm(false)}
                  className="tests-secondary-button"
                >
                  Annuler
                </button>
                <button type="submit" className="tests-primary-button">
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="tests-modal">
          <div className="tests-modal-content tests-session-modal-content">
            <span className="tests-close" onClick={() => { setShowEditModal(false); setEditingTest(null); }}>&times;</span>
            <div className="tests-modal-header">
              <h3 className="tests-section-title">Modifier le test</h3>
            </div>
            <form onSubmit={handleUpdateTest} className="tests-session-form">
              <input
                type="hidden"
                value={formData.sessionId}
              />
              <div className="tests-form-row">
                <div className="tests-form-group">
                  <label className="tests-label">Fonction *</label>
                  <input
                    type="text"
                    placeholder="Fonction"
                    value={formData.fonction}
                    onChange={(e) => setFormData({ ...formData, fonction: e.target.value })}
                    className="tests-input"
                    required
                  />
                </div>
                <div className="tests-form-group">
                  <label className="tests-label">Statut *</label>
                  <select
                    value={formData.statut}
                    onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                    className="tests-select"
                    required
                  >
                    <option value="">Sélectionner...</option>
                    <option value="OK">OK</option>
                    <option value="BUG">BUG</option>
                    <option value="EN COURS">EN COURS</option>
                    <option value="BLOQUE">BLOQUE</option>
                  </select>
                </div>
              </div>
              <div className="tests-form-group">
                <label className="tests-label">Précondition</label>
                <textarea
                  placeholder="Précondition"
                  value={formData.precondition}
                  onChange={(e) => setFormData({ ...formData, precondition: e.target.value })}
                  className="tests-textarea"
                />
              </div>
              <div className="tests-form-group">
                <label className="tests-label">Étapes</label>
                <textarea
                  placeholder="Étapes"
                  value={formData.etapes}
                  onChange={(e) => setFormData({ ...formData, etapes: e.target.value })}
                  className="tests-textarea"
                />
              </div>
              <div className="tests-form-row">
                <div className="tests-form-group">
                  <label className="tests-label">Résultat attendu</label>
                  <textarea
                    placeholder="Résultat Attendu"
                    value={formData.resultatAttendu}
                    onChange={(e) => setFormData({ ...formData, resultatAttendu: e.target.value })}
                    className="tests-textarea"
                  />
                </div>
                <div className="tests-form-group">
                  <label className="tests-label">Résultat obtenu</label>
                  <textarea
                    placeholder="Résultat Obtenu"
                    value={formData.resultatObtenu}
                    onChange={(e) => setFormData({ ...formData, resultatObtenu: e.target.value })}
                    className="tests-textarea"
                  />
                </div>
              </div>
              <div className="tests-form-group">
                <label className="tests-label">Commentaires</label>
                <textarea
                  placeholder="Commentaires"
                  value={formData.commentaires}
                  onChange={(e) => setFormData({ ...formData, commentaires: e.target.value })}
                  className="tests-textarea"
                />
              </div>
              <div className="tests-form-group">
                <label className="tests-label">Image (capture d'écran)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData({ ...formData, image: reader.result as string });
                        setImagePreview(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="tests-file-input"
                />
                {imagePreview && (
                  <div className="tests-image-preview">
                    <img src={imagePreview} alt="Preview" className="tests-preview-img" />
                    <button 
                      type="button" 
                      onClick={() => { setFormData({ ...formData, image: '' }); setImagePreview(null); }}
                      className="tests-remove-image-btn"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
              <div className="tests-form-actions">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingTest(null); }}
                  className="tests-secondary-button"
                >
                  Annuler
                </button>
                <button type="submit" className="tests-primary-button">
                  Modifier le test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tests;
