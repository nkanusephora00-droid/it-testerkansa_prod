import React, { useEffect, useState } from 'react';
import { applicationsAPI, Application } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import '../styles/pages/Applications.css';

const Applications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({ nom: '', description: '', version: '', environnement: '' });
  const [editFormData, setEditFormData] = useState({ nom: '', description: '', version: '', environnement: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const filtered = applications.filter(app => 
      app.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.description && app.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (app.version && app.version.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (app.environnement && app.environnement.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredApplications(filtered);
  }, [searchTerm, applications]);

  const fetchApplications = async () => {
    try {
      const data: any = await applicationsAPI.getAll();
      const apps = Array.isArray(data) ? data : (data?.content || []);
      setApplications(apps);
      setFilteredApplications(apps);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error(err);
      }
      setMessage({ type: 'error', text: 'Erreur de chargement des applications' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await applicationsAPI.create(formData);
      setMessage({ type: 'success', text: 'Application ajoutée avec succès!' });
      setFormData({ nom: '', description: '', version: '', environnement: '' });
      setShowCreateModal(false);
      fetchApplications();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Erreur lors de l\'ajout' });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;
    
    try {
      await applicationsAPI.update(editingApp.id, editFormData);
      setMessage({ type: 'success', text: 'Application mise à jour avec succès!' });
      setShowModal(false);
      setEditingApp(null);
      setEditFormData({ nom: '', description: '', version: '', environnement: '' });
      fetchApplications();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Erreur lors de la mise à jour' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette application ?')) return;
    
    try {
      await applicationsAPI.delete(id);
      setMessage({ type: 'success', text: 'Application supprimée avec succès!' });
      fetchApplications();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Erreur lors de la suppression' });
    }
  };

  const openEditModal = (app: Application) => {
    setEditingApp(app);
    setEditFormData({
      nom: app.nom,
      description: app.description || '',
      version: app.version || '',
      environnement: app.environnement || ''
    });
    setShowModal(true);
  };

  return (
    <div className="applications-container">
      <main className="applications-main">
        <div className="applications-header">
          <div>
            <h2 className="applications-page-title">Gestion des applications</h2>
            <p className="applications-page-subtitle">Centralisez vos applications, leurs versions et environnements.</p>
          </div>
          <button className="applications-primary-button" onClick={() => setShowCreateModal(true)}>
            Nouvelle application
          </button>
        </div>
        
        {message.text && (
          <div className={message.type === 'success' ? 'applications-success' : 'applications-error'}>
            {message.text}
          </div>
        )}

        <div className={isMobile ? 'applications-table-section applications-table-section-mobile' : 'applications-table-section'}>
          <div className="applications-list-header">
            <div>
              <h3 className="applications-section-title">Liste des applications</h3>
              <div className="applications-stats">
                <span className="applications-stat-item">Total: {applications.length}</span>
                <span className="applications-stat-item">Affichées: {filteredApplications.length}</span>
              </div>
            </div>
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="applications-search-input"
            />
          </div>
          {loading ? (
            <p>Chargement...</p>
          ) : isMobile ? (
            <div className={isMobile ? 'applications-applications-grid applications-applications-grid-mobile' : 'applications-applications-grid'}>
              {filteredApplications.map((app) => (
                <div key={app.id} className={isMobile ? 'applications-app-card applications-app-card-mobile' : 'applications-app-card'}>
                  <div className="applications-app-card-top">
                    <div className="applications-app-icon">
                      <i className="fas fa-mobile-alt"></i>
                    </div>
                  </div>
                  <div className="applications-app-card-content">
                    <h4 className="applications-app-name">{app.nom}</h4>
                    <div className="applications-app-details">
                      {app.version && (
                        <div className="applications-app-detail">
                          <span className="applications-detail-label">Version:</span>
                          {app.version}
                        </div>
                      )}
                      {app.environnement && (
                        <div className="applications-app-detail">
                          <span className="applications-detail-label">Env:</span>
                          {app.environnement}
                        </div>
                      )}
                    </div>
                    {app.description && (
                      <p className="applications-app-description">{app.description}</p>
                    )}
                  </div>
                  <div className="applications-app-card-actions">
                    <button className="applications-icon-button" onClick={() => openEditModal(app)} title="Modifier">
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button className="applications-icon-button" onClick={() => handleDelete(app.id)} title="Supprimer">
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ overflowX: 'auto', margin: '0 -12px', padding: '0 12px' }}>
              <table className="applications-table">
                <thead>
                  <tr>
                    <th className="applications-table-th">ID</th>
                    <th className="applications-table-th">Nom</th>
                    <th className="applications-table-th">Version</th>
                    <th className="applications-table-th">Environnement</th>
                    <th className="applications-table-th">Description</th>
                    <th className="applications-table-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app) => (
                    <tr key={app.id} className="applications-table-tr-hover">
                      <td className="applications-table-td">{app.id}</td>
                      <td className="applications-table-td">{app.nom}</td>
                      <td className="applications-table-td">{app.version || '-'}</td>
                      <td className="applications-table-td">{app.environnement || '-'}</td>
                      <td className="applications-table-td">{app.description || '-'}</td>
                      <td className="applications-table-td-actions">
                        <button className="applications-edit-button" onClick={() => openEditModal(app)} title="Modifier">
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button className="applications-delete-button" onClick={() => handleDelete(app.id)} title="Supprimer">
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
      </main>

      {showCreateModal && (
        <div className="applications-modal">
          <div className="applications-modal-content">
            <span className="applications-close" onClick={() => setShowCreateModal(false)}>&times;</span>
            <div className="applications-modal-header">
              <h3 className="applications-section-title">Nouvelle application</h3>
              <p className="applications-modal-subtitle">Ajoutez une application et précisez sa version/environnement si nécessaire.</p>
            </div>
            <form onSubmit={handleSubmit} className="applications-modal-form">
              <div className="applications-form-row">
                <div className="applications-form-group">
                  <label className="applications-label">Nom de l'application *</label>
                  <input
                    type="text"
                    placeholder="Ex: Portail RH"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="applications-input"
                    required
                  />
                </div>
                <div className="applications-form-group">
                  <label className="applications-label">Version</label>
                  <input
                    type="text"
                    placeholder="Ex: 1.0.0"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    className="applications-input"
                  />
                </div>
              </div>
              <div className="applications-form-row">
                <div className="applications-form-group">
                  <label className="applications-label">Environnement</label>
                  <input
                    type="text"
                    placeholder="Ex: Production, En test ou en web"
                    value={formData.environnement}
                    onChange={(e) => setFormData({ ...formData, environnement: e.target.value })}
                    className="applications-input"
                  />
                </div>
              </div>
              <div className="applications-form-group">
                <label className="applications-label">Description</label>
                <textarea
                  placeholder="Description de l'application"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="applications-textarea"
                  rows={3}
                />
              </div>
              <div className="applications-form-actions">
                <button type="button" className="applications-cancel-button" onClick={() => setShowCreateModal(false)}>Annuler</button>
                <button type="submit" className="applications-submit-button">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal && (
        <div className="applications-modal">
          <div className="applications-modal-content">
            <span className="applications-close" onClick={() => setShowModal(false)}>&times;</span>
            <h3 className="applications-section-title">Modifier l'application</h3>
            <form onSubmit={handleEdit} className="applications-modal-form">
              <div className="applications-form-row">
                <div className="applications-form-group">
                  <label className="applications-label">Nom</label>
                  <input
                    type="text"
                    value={editFormData.nom}
                    onChange={(e) => setEditFormData({ ...editFormData, nom: e.target.value })}
                    className="applications-input"
                    required
                  />
                </div>
                <div className="applications-form-group">
                  <label className="applications-label">Version</label>
                  <input
                    type="text"
                    value={editFormData.version}
                    onChange={(e) => setEditFormData({ ...editFormData, version: e.target.value })}
                    className="applications-input"
                    placeholder="ex: 1.0"
                  />
                </div>
              </div>
              <div className="applications-form-row">
                <div className="applications-form-group">
                  <label className="applications-label">Environnement</label>
                  <input
                    type="text"
                    value={editFormData.environnement}
                    onChange={(e) => setEditFormData({ ...editFormData, environnement: e.target.value })}
                    className="applications-input"
                    placeholder="ex: Mobile, Production"
                  />
                </div>
              </div>
              <div className="applications-form-group">
                <label className="applications-label">Description</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="applications-textarea"
                  style={{ minHeight: '80px' }}
                />
              </div>
              <div className="applications-form-actions">
                <button type="button" className="applications-cancel-button" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="applications-submit-button">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;
