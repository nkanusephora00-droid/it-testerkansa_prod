import React, { useEffect, useState } from 'react';
import { usersAPI, User } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash, faToggleOn, faToggleOff } from '@fortawesome/free-solid-svg-icons';

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
    <div style={styles.container}>
      <main style={styles.main}>
        <h2>Gestion des Utilisateurs</h2>
        
        {message.text && (
          <div style={message.type === 'success' ? styles.success : styles.error}>
            {message.text}
          </div>
        )}

        <div style={styles.formSection}>
          <div style={styles.sectionHeader}>
            <h3>Ajouter un nouvel utilisateur</h3>
            {!showAddForm && (
              <button 
                style={styles.addButton} 
                onClick={() => setShowAddForm(true)}
              >
                <FontAwesomeIcon icon={faPen} /> Ajouter
              </button>
            )}
          </div>
          {showAddForm && (
            <form onSubmit={handleSubmit} style={styles.form}>
              <input
                type="text"
                placeholder="Nom d'utilisateur"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                style={styles.input}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={styles.input}
                required
              />
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                style={styles.select}
              >
                <option value="user">Utilisateur</option>
                <option value="admin">Administrateur</option>
              </select>
              <input
                type="password"
                placeholder="Mot de passe"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={styles.input}
                required
              />
              <div style={styles.formActions}>
                <button 
                  type="button" 
                  style={styles.cancelButton} 
                  onClick={() => setShowAddForm(false)}
                >
                  Annuler
                </button>
                <button type="submit" style={styles.submitButton}>Ajouter l'utilisateur</button>
              </div>
            </form>
          )}
        </div>

        <div style={styles.tableSection}>
          <h3>Liste des utilisateurs</h3>
          {loading ? (
            <p>Chargement...</p>
          ) : (
            <div className="table-container" style={{ overflowX: 'auto', margin: '0 -12px', padding: '0 12px' }}>
              <table style={styles.table}>
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
                      <td style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button 
                          style={{
                            ...styles.toggleOnButton,
                            padding: '8px 12px',
                            backgroundColor: 'transparent',
                            color: user.isActive ? '#27ae60' : '#95a5a6'
                          }} 
                          onClick={() => handleToggleUser(user)} 
                          title={user.isActive ? 'Désactiver' : 'Activer'}
                        >
                          <FontAwesomeIcon icon={user.isActive ? faToggleOn : faToggleOff} />
                        </button>
                        <button style={{...styles.editButton, padding: '8px 12px', backgroundColor: 'transparent', color: '#3498db'}} onClick={() => openEditModal(user)} title="Modifier">
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                        <button style={{...styles.deleteButton, padding: '8px 12px', backgroundColor: 'transparent', color: '#ff6b6b'}} onClick={() => handleDelete(user.id)} title="Supprimer">
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
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <span style={styles.close} onClick={() => setShowModal(false)}>&times;</span>
            <h3>Modifier l'utilisateur</h3>
            <form onSubmit={handleEdit} style={styles.modalForm}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nom d'utilisateur</label>
                <input type="text" value={editingUser?.username} disabled style={styles.inputDisabled} />
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Email</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Rôle</label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    style={styles.select}
                  >
                    <option value="user">Utilisateur</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Actif</label>
                  <select
                    value={editFormData.isActive ? 'true' : 'false'}
                    onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.value === 'true' })}
                    style={styles.select}
                  >
                    <option value="true">Oui</option>
                    <option value="false">Non</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nouveau mot de passe</label>
                  <input
                    type="password"
                    placeholder="Laisser vide pour garder l'actuel"
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    style={styles.input}
                  />
                </div>
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
  formSection: { backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px var(--shadow-color)' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  addButton: { padding: '10px 20px', backgroundColor: 'var(--success-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(39, 174, 96, 0.2)' },
  tableSection: { backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px var(--shadow-color)' },
  sectionTitle: { margin: '0 0 20px', fontSize: '18px' },
  form: { display: 'flex', flexDirection: 'column' as const, gap: '18px', maxWidth: '760px' },
  modalForm: { display: 'flex', flexDirection: 'column' as const, gap: '20px', padding: '8px 0' },
  formRow: { display: 'flex', gap: '16px', flexWrap: 'wrap' as const },
  formGroup: { marginBottom: '16px', flex: 1 },
  label: { display: 'block', marginBottom: '6px', fontWeight: 500, color: 'var(--text-secondary)', fontSize: '13px' },
  input: { width: '100%', padding: '12px 14px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '14px', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' },
  inputDisabled: { width: '100%', padding: '12px 14px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-primary)', fontSize: '14px', color: 'var(--text-muted)' },
  select: { width: '100%', padding: '12px 14px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '14px', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' },
  submitButton: { padding: '12px 24px', backgroundColor: 'var(--success-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s ease', minWidth: '120px', boxShadow: '0 2px 4px rgba(39, 174, 96, 0.2)' },
  cancelButton: { padding: '12px 24px', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s ease', minWidth: '120px', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' },
  table: { width: '100%', borderCollapse: 'collapse' as const, borderRadius: 'var(--radius-md)', overflow: 'hidden' },
  editButton: { padding: '8px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' },
  deleteButton: { padding: '8px', backgroundColor: 'transparent', color: 'var(--danger-color)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' },
  toggleOnButton: { padding: '8px', backgroundColor: 'transparent', color: 'var(--success-color)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' },
  toggleOffButton: { padding: '8px', backgroundColor: 'transparent', color: 'var(--text-muted)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' },
  success: { padding: '14px', backgroundColor: 'var(--success-color)', color: 'white', borderRadius: 'var(--radius-md)', marginBottom: '20px' },
  error: { padding: '14px', backgroundColor: 'var(--danger-color)', color: 'white', borderRadius: 'var(--radius-md)', marginBottom: '20px' },
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
  close: { position: 'absolute' as const, top: '15px', right: '20px', fontSize: '28px', cursor: 'pointer', color: 'var(--text-muted)' },
  formActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '20px', flexWrap: 'wrap' as const },
};

export default Users;
