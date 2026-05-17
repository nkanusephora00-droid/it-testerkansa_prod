import React, { useEffect, useState } from 'react';
import { todosAPI, Todo, usersAPI, UserWithTodos } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faCheck, faUsers, faListCheck, faDownload, faTimes } from '@fortawesome/free-solid-svg-icons';
import '../styles/pages/Todos.css';

const Todos: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [usersWithTodos, setUsersWithTodos] = useState<UserWithTodos[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [quickAddMode, setQuickAddMode] = useState(false);
  const [viewMode, setViewMode] = useState<'todos' | 'users'>('todos');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'normal',
    dueDate: '',
  });

  useEffect(() => {
    if (viewMode === 'todos') {
      fetchTodos();
    } else {
      fetchUsersWithTodos();
    }
  }, [viewMode]);

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

  const fetchUsersWithTodos = async () => {
    try {
      const [usersData, todosData] = await Promise.all([
        usersAPI.getAll(),
        todosAPI.getAll(),
      ]);

      // Filter todos by user using createdByUsername
      const usersWithTodos = usersData.map((user: any) => ({
        ...user,
        todos: todosData.filter((todo: Todo) => todo.createdByUsername === user.username)
      }));

      setUsersWithTodos(usersWithTodos);
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching users with todos:', err);
      }
      setMessage({ type: 'error', text: 'Erreur lors du chargement des utilisateurs avec leurs tâches' });
    } finally {
      setLoading(false);
    }
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
      if (viewMode === 'todos') {
        fetchTodos();
      } else {
        fetchUsersWithTodos();
      }
    } catch (err: unknown) {
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await todosAPI.toggle(id);
      if (viewMode === 'todos') {
        fetchTodos();
      } else {
        fetchUsersWithTodos();
      }
    } catch (err: unknown) {
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette tâche?')) return;
    try {
      await todosAPI.delete(id);
      setMessage({ type: 'success', text: 'Tâche supprimée!' });
      if (viewMode === 'todos') {
        fetchTodos();
      } else {
        fetchUsersWithTodos();
      }
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
    return <div className="todos-loading">Chargement...</div>;
  }

  return (
    <div className="todos-container">
      <main className="todos-main">
        <div className="todos-page-header">
          <div>
            <h2 className="todos-page-title">
              {viewMode === 'todos' ? <><FontAwesomeIcon icon={faListCheck} /> Liste des tâches</> : <><FontAwesomeIcon icon={faUsers} /> Utilisateurs avec leurs tâches</>}
            </h2>
            <p className="todos-page-subtitle">
              {viewMode === 'todos' ? (
                <>{pendingTodos.length} tâche{pendingTodos.length !== 1 ? 's' : ''} en attente · {completedTodos.length} terminée{completedTodos.length !== 1 ? 's' : ''}</>
              ) : (
                <>{usersWithTodos.length} utilisateur{usersWithTodos.length !== 1 ? 's' : ''} avec {usersWithTodos.reduce((acc, user) => acc + user.todos.length, 0)} tâche{usersWithTodos.reduce((acc, user) => acc + user.todos.length, 0) !== 1 ? 's' : ''}</>
              )}
            </p>
          </div>
          <div className="todos-header-actions">
            <div className="todos-view-toggle">
              <button 
                className={viewMode === 'todos' ? 'todos-view-button-active' : 'todos-view-button'}
                onClick={() => setViewMode('todos')}
              >
                <FontAwesomeIcon icon={faListCheck} /> Tâches
              </button>
              <button 
                className={viewMode === 'users' ? 'todos-view-button-active' : 'todos-view-button'}
                onClick={() => setViewMode('users')}
              >
                <FontAwesomeIcon icon={faUsers} /> Utilisateurs
              </button>
            </div>
            {viewMode === 'todos' && (
              <>
                <button className="todos-download-button" onClick={downloadTodos} disabled={todos.length === 0}>
                  <FontAwesomeIcon icon={faDownload} /> Télécharger
                </button>
                <button className="todos-primary-button" onClick={() => setShowForm(true)}>
                  <FontAwesomeIcon icon={faPlus} /> Nouvelle tâche
                </button>
              </>
            )}
          </div>
        </div>

        {message.text && (
          <div className={message.type === 'success' ? 'todos-success' : 'todos-error'}>
            {message.text}
          </div>
        )}

        {showForm && (
          <div className="todos-form-card">
            <h3 className="todos-form-title">
              {editingTodo ? 'Modifier la tâche' : (quickAddMode ? 'Ajout rapide de tâches' : 'Nouvelle tâche')}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="todos-form-group">
                <label className="todos-label">Titre * {quickAddMode && '(seul champ obligatoire en mode rapide)'}</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="todos-input"
                  placeholder="Titre de la tâche"
                  autoFocus={quickAddMode}
                  required
                />
              </div>
              <div className="todos-form-group">
                <label className="todos-label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="todos-textarea"
                  placeholder="Description de la tâche"
                  rows={3}
                />
              </div>
              <div className="todos-form-row">
                <div className="todos-form-group">
                  <label className="todos-label">Priorité</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="todos-select"
                  >
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                  </select>
                </div>
                <div className="todos-form-group">
                  <label className="todos-label">Date d'échéance</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="todos-input"
                  />
                </div>
              </div>
              <div className="todos-form-actions">
                <button type="button" className="todos-cancel-button" onClick={() => { setShowForm(false); setEditingTodo(null); setQuickAddMode(false); }}>
                  Annuler
                </button>
                <button type="submit" className="todos-submit-button">
                  {editingTodo ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
            <button
              className="todos-close-button"
              onClick={() => { setShowForm(false); setEditingTodo(null); setQuickAddMode(false); }}
              title="Fermer"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        )}

        {todos.length === 0 ? (
          <div className="todos-empty-state">
            <div className="todos-empty-icon">
              <FontAwesomeIcon icon={faListCheck} />
            </div>
            <h3>Aucune tâche</h3>
            <p>Créez votre première tâche pour commencer</p>
            <button className="todos-empty-button" onClick={() => setShowForm(true)}>
              <FontAwesomeIcon icon={faPlus} /> Créer une tâche
            </button>
          </div>
        ) : (
          <div className="todos-lists-container">
            {pendingTodos.length > 0 && (
              <div className="todos-list-section">
                <h3 className="todos-list-title">À faire</h3>
                <div className="todos-todo-list">
                  {pendingTodos.map((todo) => (
                    <div key={todo.id} className="todos-todo-item">
                      <button
                        className="todos-check-button"
                        onClick={() => handleToggle(todo.id)}
                        title="Marquer comme terminé"
                      >
                        <FontAwesomeIcon icon={faCheck} />
                      </button>
                      <div className="todos-todo-content">
                        <div className="todos-todo-title">{todo.title}</div>
                        {todo.description && (
                          <div className="todos-todo-description">{todo.description}</div>
                        )}
                        <div className="todos-todo-meta">
                          {todo.priority === 'high' && (
                            <span className="todos-priority-badge" style={{ backgroundColor: 'var(--danger-color)' }}>
                              Haute
                            </span>
                          )}
                          {todo.priority === 'low' && (
                            <span className="todos-priority-badge">Basse</span>
                          )}
                          {todo.createdByUsername && (
                            <span className="todos-creator-badge">
                              Par: {todo.createdByUsername}
                            </span>
                          )}
                          {todo.dueDate && (
                            <span className="todos-due-date">
                              <FontAwesomeIcon icon={faCheck} style={{ marginRight: 4 }} />
                              Échéance: {todo.dueDate}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="todos-todo-actions">
                        <button className="todos-edit-button" onClick={() => handleEdit(todo)} title="Modifier">
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button className="todos-delete-button" onClick={() => handleDelete(todo.id)} title="Supprimer">
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {completedTodos.length > 0 && (
              <div className="todos-list-section">
                <h3 className="todos-list-title">Terminées</h3>
                <div className="todos-todo-list">
                  {completedTodos.map((todo) => (
                    <div key={todo.id} className="todos-todo-item todos-completed-item">
                      <button
                        className="todos-check-button todos-check-button-completed"
                        onClick={() => handleToggle(todo.id)}
                        title="Marquer comme non terminé"
                      >
                        <FontAwesomeIcon icon={faCheck} />
                      </button>
                      <div className="todos-todo-content">
                        <div className="todos-todo-title todos-todo-title-completed">{todo.title}</div>
                        {todo.description && (
                          <div className="todos-todo-description">{todo.description}</div>
                        )}
                        {todo.createdByUsername && (
                          <div className="todos-todo-meta">
                            <span className="todos-creator-badge">
                              Par: {todo.createdByUsername}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="todos-todo-actions">
                        <button className="todos-delete-button" onClick={() => handleDelete(todo.id)} title="Supprimer">
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

        {viewMode === 'users' && (
          <div className="todos-users-container">
            {usersWithTodos.length === 0 ? (
              <div className="todos-empty-state">
                <div className="todos-empty-icon">
                  <FontAwesomeIcon icon={faUsers} />
                </div>
                <h3>Aucun utilisateur avec des tâches</h3>
                <p>Aucun utilisateur n'a de tâches assignées</p>
              </div>
            ) : (
              usersWithTodos.map((user) => (
                <div key={user.id} className="todos-user-card">
                  <div className="todos-user-header">
                    <div className="todos-user-info">
                      <h3 className="todos-user-name">{user.username}</h3>
                      <p className="todos-user-email">{user.email}</p>
                      <span className="todos-role-badge" style={{ backgroundColor: user.role === 'admin' ? 'var(--danger-color)' : 'var(--info-color)' }}>
                        {user.role}
                      </span>
                    </div>
                    <div className="todos-user-stats">
                      <span className="todos-stat-badge">
                        {user.todos.filter(t => !t.completed).length} en cours
                      </span>
                      <span className="todos-stat-badge todos-stat-badge-success">
                        {user.todos.filter(t => t.completed).length} terminées
                      </span>
                    </div>
                  </div>
                  
                  {user.todos.length === 0 ? (
                    <p className="todos-no-todos">Aucune tâche assignée</p>
                  ) : (
                    <div className="todos-user-todos-list">
                      {user.todos.map((todo) => (
                        <div key={todo.id} className="todos-user-todo-item">
                          <button
                            className="todos-check-button"
                            onClick={() => handleToggle(todo.id)}
                            title={todo.completed ? "Marquer comme non terminé" : "Marquer comme terminé"}
                          >
                            <FontAwesomeIcon icon={faCheck} />
                          </button>
                          <div className="todos-todo-content">
                            <div className="todos-todo-title" style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
                              {todo.title}
                            </div>
                            {todo.description && (
                              <div className="todos-todo-description">{todo.description}</div>
                            )}
                          </div>
                          <div className="todos-todo-actions">
                            <button className="todos-delete-button" onClick={() => handleDelete(todo.id)} title="Supprimer">
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Todos;
