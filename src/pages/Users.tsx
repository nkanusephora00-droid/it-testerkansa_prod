import React, { useEffect, useState } from 'react';
import { usersAPI, User } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash, faToggleOn, faToggleOff } from '@fortawesome/free-solid-svg-icons';
import '../styles/pages/Users.css';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'user',
    password: '',
  });

  const [editFormData, setEditFormData] = useState({
    email: '',
    role: 'user',
    isActive: true,
    password: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data: any = await usersAPI.getAll();
      // Gérer à la fois les réponses tableau direct et PageResponse
      if (Array.isArray(data)) {
        setUsers(data);
      } else if (data && data.content) {
        setUsers(data.content);
      } else {
        setUsers([]);
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching users:', err);
      }
      setMessage({ type: 'error', text: 'Erreur de chargement des utilisateurs' });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await usersAPI.create(formData);
      setMessage({ type: 'success', text: 'Utilisateur ajouté avec succès!' });
      setFormData({ username: '', email: '', role: 'user', password: '' });
      setShowAddForm(false);
      fetchUsers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Erreur lors de l\'ajout' });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      const updateData: any = {
        email: editFormData.email,
        role: editFormData.role,
        isActive: editFormData.isActive,
      };
      if (editFormData.password) {
        updateData.password = editFormData.password;
      }
      
      await usersAPI.update(editingUser.id, updateData);
      setMessage({ type: 'success', text: 'Utilisateur mis à jour avec succès!' });
      setShowModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Erreur lors de la mise à jour' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    
    try {
      await usersAPI.delete(id);
      setMessage({ type: 'success', text: 'Utilisateur supprimé avec succès!' });
      fetchUsers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Erreur lors de la suppression' });
    }
  };

  const handleToggleUser = async (user: User) => {
    try {
      await usersAPI.toggleStatus(user.id);
      setMessage({ type: 'success', text: user.isActive ? 'Utilisateur désactivé!' : 'Utilisateur activé!' });
      fetchUsers();
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la modification du statut' });
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      email: user.email,
      role: user.role,
      isActive: user.isActive ?? true,
      password: '',
    });
    setShowModal(true);
  };

  return (
    <div className="users-container">
      <main className="users-main">
        <h2>Gestion des Utilisateurs</h2>
        
        {message.text && (
          <div className={message.type === 'success' ? 'users-success' : 'users-error'}>
            {message.text}
          </div>
        )}

        <div className="users-form-section">
          <div className="users-section-header">
            <h3>Ajouter un nouvel utilisateur</h3>
            {!showAddForm && (
              <button 
                className="users-add-button" 
                onClick={() => setShowAddForm(true)}
              >
                <FontAwesomeIcon icon={faPen} /> Ajouter
              </button>
            )}
          </div>
          {showAddForm && (
            <form onSubmit={handleSubmit} className="users-form">
              <input
                type="text"
                placeholder="Nom d'utilisateur"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="users-input"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="users-input"
                required
              />
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="users-select"
              >
                <option value="user">Utilisateur</option>
                <option value="admin">Administrateur</option>
              </select>
              <input
                type="password"
                placeholder="Mot de passe"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="users-input"
                required
              />
              <div className="users-form-actions">
                <button 
                  type="button" 
                  className="users-cancel-button" 
                  onClick={() => setShowAddForm(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="users-submit-button">Ajouter l'utilisateur</button>
              </div>
            </form>
          )}
        </div>

        <div className="users-table-section">
          <h3>Liste des utilisateurs</h3>
          {loading ? (
            <p>Chargement...</p>
          ) : (
            <div className="table-container" style={{ overflowX: 'auto', margin: '0 -12px', padding: '0 12px' }}>
              <table className="users-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nom d'utilisateur</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Actif</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</td>
                      <td>{user.isActive ? 'Oui' : 'Non'}</td>
                      <td className="users-table-actions">
                        <button 
                          className="users-toggle-on-button"
                          style={{ color: user.isActive ? '#27ae60' : '#95a5a6' }}
                          onClick={() => handleToggleUser(user)} 
                          title={user.isActive ? 'Désactiver' : 'Activer'}
                        >
                          <FontAwesomeIcon icon={user.isActive ? faToggleOn : faToggleOff} />
                        </button>
                        <button className="users-edit-button" style={{ color: '#3498db' }} onClick={() => openEditModal(user)} title="Modifier">
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                        <button className="users-delete-button" style={{ color: '#ff6b6b' }} onClick={() => handleDelete(user.id)} title="Supprimer">
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

      {showModal && (
        <div className="users-modal">
          <div className="users-modal-content">
            <span className="users-close" onClick={() => setShowModal(false)}>&times;</span>
            <h3>Modifier l'utilisateur</h3>
            <form onSubmit={handleEdit} className="users-modal-form">
              <div className="users-form-group">
                <label className="users-label">Nom d'utilisateur</label>
                <input type="text" value={editingUser?.username} disabled className="users-input-disabled" />
              </div>
              <div className="users-form-row">
                <div className="users-form-group">
                  <label className="users-label">Email</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="users-input"
                    required
                  />
                </div>
                <div className="users-form-group">
                  <label className="users-label">Rôle</label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    className="users-select"
                  >
                    <option value="user">Utilisateur</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
              </div>
              <div className="users-form-row">
                <div className="users-form-group">
                  <label className="users-label">Actif</label>
                  <select
                    value={editFormData.isActive ? 'true' : 'false'}
                    onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.value === 'true' })}
                    className="users-select"
                  >
                    <option value="true">Oui</option>
                    <option value="false">Non</option>
                  </select>
                </div>
                <div className="users-form-group">
                  <label className="users-label">Nouveau mot de passe</label>
                  <input
                    type="password"
                    placeholder="Laisser vide pour garder l'actuel"
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    className="users-input"
                  />
                </div>
              </div>
              <div className="users-form-actions">
                <button type="button" className="users-cancel-button" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="users-submit-button">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
