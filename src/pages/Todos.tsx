import React, { useEffect, useState } from 'react';
import { todosAPI, usersAPI } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faCheck, faTimes, faDownload, faEdit, faListCheck } from '@fortawesome/free-solid-svg-icons';

interface Todo {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  created_by?: number;
}

const Todos: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [quickAddMode, setQuickAddMode] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'normal',
    dueDate: '',
  });

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const [todosData, usersData] = await Promise.all([
        todosAPI.getAll(),
        usersAPI.getAll(),
      ]);
      setTodos(todosData);
      setUsers(usersData);
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching todos:', err);
      }
      setMessage({ type: 'error', text: 'Erreur lors du chargement des tâches' });
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? user.username : `Utilisateur ${userId}`;
  };

  // Debug: voir les données des todos
  useEffect(() => {
    if (todos.length > 0) {
      console.log('Todos data:', todos);
      console.log('Users data:', users);
    }
  }, [todos, users]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTodo) {
        await todosAPI.update(editingTodo.id, {
          title: formData.title,
          description: formData.description || null,
          priority: formData.priority,
          dueDate: formData.dueDate || null,
        });
        setMessage({ type: 'success', text: 'Tâche modifiée!' });
        resetForm();
      } else {
        await todosAPI.create({
          title: formData.title,
          description: formData.description || null,
          priority: formData.priority,
          dueDate: formData.dueDate || null,
        });
        setMessage({ type: 'success', text: 'Tâche ajoutée!' });
        if (quickAddMode) {
          setFormData({ ...formData, title: '' });
        } else {
          resetForm();
        }
      }
      fetchTodos();
    } catch (err: unknown) {
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await todosAPI.toggle(id);
      fetchTodos();
    } catch (err: unknown) {
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette tâche?')) return;
    try {
      await todosAPI.delete(id);
      setMessage({ type: 'success', text: 'Tâche supprimée!' });
      fetchTodos();
    } catch (err: unknown) {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' });
    }
  };

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setFormData({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      dueDate: todo.dueDate || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', priority: 'normal', dueDate: '' });
    setShowForm(false);
    setEditingTodo(null);
    setQuickAddMode(false);
  };

  const downloadTodos = () => {
    const completedTodos = todos.filter(t => t.completed);
    const pendingTodos = todos.filter(t => !t.completed);

    let content = `===== MA LISTE DE TÂCHES =====\n`;
    content += `Date: ${new Date().toLocaleDateString('fr-FR')}\n`;
    content += `Total: ${todos.length} tâches | Terminées: ${completedTodos.length} | En attente: ${pendingTodos.length}\n\n`;

    content += `----- À FAIRE (${pendingTodos.length}) -----\n`;
    pendingTodos.forEach((todo, index) => {
      content += `${index + 1}. [ ] ${todo.title}\n`;
      if (todo.description) content += `   Description: ${todo.description}\n`;
      if (todo.dueDate) content += `   Échéance: ${todo.dueDate}\n`;
      if (todo.priority === 'high') content += `   Priorité: HAUTE\n`;
      content += `\n`;
    });

    content += `----- TERMINÉES (${completedTodos.length}) -----\n`;
    completedTodos.forEach((todo, index) => {
      content += `${index + 1}. [x] ${todo.title}\n`;
      if (todo.description) content += `   Description: ${todo.description}\n`;
      content += `\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `todo-list-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const completedTodos = todos.filter(t => t.completed);
  const pendingTodos = todos.filter(t => !t.completed);

  if (loading) {
    return <div style={styles.loading}>Chargement...</div>;
  }

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <div style={styles.pageHeader}>
          <div>
            <h2 style={styles.pageTitle}><FontAwesomeIcon icon={faListCheck} /> Liste des tâches</h2>
            <p style={styles.pageSubtitle}>
              {pendingTodos.length} tâche{pendingTodos.length !== 1 ? 's' : ''} en attente · {completedTodos.length} terminée{completedTodos.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={styles.headerActions}>
            <button style={styles.downloadButton} onClick={downloadTodos} disabled={todos.length === 0}>
              <FontAwesomeIcon icon={faDownload} /> Télécharger
            </button>
            <button style={styles.addButton} onClick={() => { resetForm(); setShowForm(true); }}>
              <FontAwesomeIcon icon={faPlus} /> Nouvelle tâche
            </button>
          </div>
        </div>

        {message.text && (
          <div style={message.type === 'success' ? styles.success : styles.error}>
            {message.text}
          </div>
        )}

        {showForm && (
          <div style={styles.formCard}>
            <h3 style={styles.formTitle}>
              {editingTodo ? 'Modifier la tâche' : (quickAddMode ? 'Ajout rapide de tâches' : 'Nouvelle tâche')}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Titre * {quickAddMode && '(seul champ obligatoire en mode rapide)'}</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={styles.input}
                  placeholder="Titre de la tâche"
                  autoFocus={quickAddMode}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={styles.textarea}
                  placeholder="Description détaillée (optionnel)"
                  rows={3}
                />
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Priorité</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    style={styles.select}
                  >
                    <option value="low">Basse</option>
                    <option value="normal">Normale</option>
                    <option value="high">Haute</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Date limite</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.formActions}>
                <label style={styles.quickAddLabel}>
                  <input
                    type="checkbox"
                    checked={quickAddMode}
                    onChange={(e) => setQuickAddMode(e.target.checked)}
                    style={styles.quickAddCheckbox}
                  />
                  Mode rapide (garder le formulaire ouvert)
                </label>
                <button type="button" style={styles.cancelButton} onClick={resetForm}>
                  <FontAwesomeIcon icon={faTimes} /> Fermer
                </button>
                <button type="submit" style={styles.submitButton}>
                  <FontAwesomeIcon icon={faCheck} /> {editingTodo ? 'Enregistrer' : (quickAddMode ? 'Ajouter & Continuer' : 'Ajouter')}
                </button>
              </div>
            </form>
          </div>
        )}

        {todos.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <FontAwesomeIcon icon={faListCheck} />
            </div>
            <h3>Aucune tâche</h3>
            <p>Créez votre première tâche pour commencer</p>
            <button style={styles.emptyButton} onClick={() => setShowForm(true)}>
              <FontAwesomeIcon icon={faPlus} /> Créer une tâche
            </button>
          </div>
        ) : (
          <div style={styles.listsContainer}>
            {pendingTodos.length > 0 && (
              <div style={styles.listSection}>
                <h3 style={styles.listTitle}>À faire</h3>
                <div style={styles.todoList}>
                  {pendingTodos.map((todo) => (
                    <div key={todo.id} style={styles.todoItem}>
                      <button
                        style={styles.checkButton}
                        onClick={() => handleToggle(todo.id)}
                        title="Marquer comme terminé"
                      >
                        <FontAwesomeIcon icon={faCheck} />
                      </button>
                      <div style={styles.todoContent}>
                        <div style={styles.todoTitle}>{todo.title}</div>
                        {todo.description && (
                          <div style={styles.todoDescription}>{todo.description}</div>
                        )}
                        <div style={styles.todoMeta}>
                          {todo.priority === 'high' && (
                            <span style={{ ...styles.priorityBadge, backgroundColor: 'var(--danger-color)' }}>
                              Haute
                            </span>
                          )}
                          {todo.priority === 'low' && (
                            <span style={styles.priorityBadge}>Basse</span>
                          )}
                          {todo.created_by && (
                            <span style={styles.creatorBadge}>
                              Par: {getUserName(todo.created_by)}
                            </span>
                          )}
                          {todo.dueDate && (
                            <span style={styles.dueDate}>
                              <FontAwesomeIcon icon={faCheck} style={{ marginRight: 4 }} />
                              Échéance: {todo.dueDate}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={styles.todoActions}>
                        <button style={styles.editButton} onClick={() => handleEdit(todo)} title="Modifier">
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button style={styles.deleteButton} onClick={() => handleDelete(todo.id)} title="Supprimer">
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {completedTodos.length > 0 && (
              <div style={styles.listSection}>
                <h3 style={{ ...styles.listTitle, opacity: 0.7 }}>Terminées</h3>
                <div style={styles.todoList}>
                  {completedTodos.map((todo) => (
                    <div key={todo.id} style={{ ...styles.todoItem, opacity: 0.7 }}>
                      <button
                        style={{ ...styles.checkButton, backgroundColor: 'var(--success-color)' }}
                        onClick={() => handleToggle(todo.id)}
                        title="Marquer comme non terminé"
                      >
                        <FontAwesomeIcon icon={faCheck} />
                      </button>
                      <div style={styles.todoContent}>
                        <div style={{ ...styles.todoTitle, textDecoration: 'line-through' }}>{todo.title}</div>
                        {todo.description && (
                          <div style={styles.todoDescription}>{todo.description}</div>
                        )}
                        {todo.created_by && (
                          <div style={styles.todoMeta}>
                            <span style={styles.creatorBadge}>
                              Par: {getUserName(todo.created_by)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div style={styles.todoActions}>
                        <button style={styles.deleteButton} onClick={() => handleDelete(todo.id)} title="Supprimer">
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { backgroundColor: 'var(--bg-primary)', minHeight: '100vh' },
  main: { padding: '30px', maxWidth: '900px', margin: '0 auto', width: '100%', minHeight: 'calc(100vh - 70px)' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--text-secondary)' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' },
  pageTitle: { margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '12px' },
  pageSubtitle: { margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' },
  headerActions: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  addButton: { padding: '12px 20px', backgroundColor: 'var(--success-color)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' },
  downloadButton: { padding: '12px 20px', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' },
  success: { padding: '14px', backgroundColor: 'var(--success-color)', color: 'white', borderRadius: 'var(--radius-md)', marginBottom: '20px' },
  error: { padding: '14px', backgroundColor: 'var(--danger-color)', color: 'white', borderRadius: 'var(--radius-md)', marginBottom: '20px' },
  formCard: { backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px var(--shadow-color)' },
  formTitle: { margin: '0 0 20px', fontSize: '18px' },
  formGroup: { marginBottom: '16px', flex: 1 },
  formRow: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
  label: { display: 'block', marginBottom: '6px', fontWeight: 500, color: 'var(--text-secondary)', fontSize: '13px' },
  input: { width: '100%', padding: '12px 14px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '14px', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' },
  textarea: { width: '100%', padding: '12px 14px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '14px', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', resize: 'vertical' },
  select: { width: '100%', padding: '12px 14px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '14px', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' },
  formActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '20px', flexWrap: 'wrap' },
  quickAddLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' },
  quickAddCheckbox: { width: '16px', height: '16px', cursor: 'pointer' },
  cancelButton: { padding: '12px 20px', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' },
  submitButton: { padding: '12px 20px', backgroundColor: 'var(--success-color)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' },
  emptyState: { textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' },
  emptyIcon: { fontSize: '48px', marginBottom: '16px', opacity: 0.5, color: 'var(--text-secondary)', display: 'inline-block' },
  emptyButton: { marginTop: '16px', padding: '12px 24px', backgroundColor: 'var(--success-color)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' },
  listsContainer: { display: 'flex', flexDirection: 'column', gap: '24px' },
  listSection: {},
  listTitle: { fontSize: '16px', marginBottom: '12px', color: 'var(--text-primary)' },
  todoList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  todoItem: { display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' },
  checkButton: { width: '28px', height: '28px', minWidth: '28px', borderRadius: '50%', border: '2px solid var(--success-color)', backgroundColor: 'var(--success-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', transition: 'all 0.2s' },
  todoContent: { flex: 1 },
  todoTitle: { fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' },
  todoDescription: { fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' },
  todoMeta: { display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px' },
  priorityBadge: { padding: '2px 8px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--text-muted)', color: 'white', fontSize: '11px' },
  creatorBadge: { padding: '2px 8px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--info-color)', color: 'white', fontSize: '11px' },
  dueDate: { color: 'var(--text-muted)' },
  todoActions: { display: 'flex', gap: '8px' },
  editButton: { padding: '8px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' },
  deleteButton: { padding: '8px', backgroundColor: 'transparent', color: 'var(--danger-color)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' },
};

export default Todos;
