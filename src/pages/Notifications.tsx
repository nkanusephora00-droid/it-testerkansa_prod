import React, { useEffect, useState } from 'react';
import { testsAPI, todosAPI } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faCheck, faExclamationTriangle, faInfo, faCheckCircle, faBug } from '@fortawesome/free-solid-svg-icons';
import '../styles/pages/Notifications.css';

interface Notification {
  id: string | number;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const [todos, tests] = await Promise.all([
        todosAPI.getAll(),
        testsAPI.getAll()
      ]);

      const notifs: Notification[] = [];

      todos.filter((t: import('../services/api').Todo) => !t.completed).forEach((todo: import('../services/api').Todo) => {
        notifs.push({
          id: `todo_${todo.id}`,
          type: 'info',
          title: 'Tâche en attente',
          message: todo.title,
          read: false,
          createdAt: todo.createdAt,
          link: '/todos'
        });
      });

      tests.filter((t: import('../services/api').Test) => t.statut === 'BUG').forEach((test: any) => {
        notifs.push({
          id: `bug_${test.id}`,
          type: 'error',
          title: 'Nouveau BUG détecté',
          message: `Test "${test.fonction}" - Statut: BUG`,
          read: false,
          createdAt: (test as any).createdAt || new Date().toISOString(),
          link: '/tests'
        });
      });

      tests.filter((t: import('../services/api').Test) => t.statut === 'EN COURS').forEach((test: any) => {
        notifs.push({
          id: `progress_${test.id}`,
          type: 'warning',
          title: 'Test en cours',
          message: `Test "${test.fonction}" - En cours de vérification`,
          read: false,
          createdAt: (test as any).createdAt || new Date().toISOString(),
          link: '/tests'
        });
      });

      notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Restaurer le statut "read" depuis localStorage avec gestion des préfixes
      const readNotifs = JSON.parse(localStorage.getItem('readNotifications') || '[]');
      const notifsWithReadStatus = notifs.map(n => ({
        ...n,
        read: readNotifs.includes(n.id)
      }));

      setNotifications(notifsWithReadStatus);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching notifications:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (id: string | number) => {
    setNotifications(notifs =>
      notifs.map(n => n.id === id ? { ...n, read: true } : n)
    );
    
    // Sauvegarder dans localStorage
    const readNotifs = JSON.parse(localStorage.getItem('readNotifications') || '[]');
    if (!readNotifs.includes(id)) {
      readNotifs.push(id);
      localStorage.setItem('readNotifications', JSON.stringify(readNotifs));
    }
  };

  const markAllAsRead = () => {
    setNotifications(notifs =>
      notifs.map(n => ({ ...n, read: true }))
    );
    
    // Sauvegarder tous les IDs dans localStorage
    const allIds = notifications.map(n => n.id);
    localStorage.setItem('readNotifications', JSON.stringify(allIds));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return faCheckCircle;
      case 'warning': return faExclamationTriangle;
      case 'error': return faBug;
      default: return faInfo;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'success': return 'var(--success-color)';
      case 'warning': return 'var(--warning-color)';
      case 'error': return 'var(--danger-color)';
      default: return 'var(--info-color)';
    }
  };

  const filteredNotifs = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    return 'À l\'instant';
  };

  if (loading) {
    return <div className="notifications-loading">Chargement...</div>;
  }

  return (
    <div className="notifications-container">
      <main className="notifications-main">
        <div className="notifications-header">
          <div>
            <h2 className="notifications-page-title">
              <FontAwesomeIcon icon={faBell} /> Notifications
            </h2>
            <p className="notifications-page-subtitle">
              {unreadCount > 0 ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}` : 'Toutes lues'}
            </p>
          </div>
          <div className="notifications-header-actions">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}
              className="notifications-filter-select"
            >
              <option value="all">Toutes</option>
              <option value="unread">Non lues</option>
            </select>
            {unreadCount > 0 && (
              <button className="notifications-mark-all-button" onClick={markAllAsRead}>
                <FontAwesomeIcon icon={faCheck} /> Tout marquer comme lu
              </button>
            )}
          </div>
        </div>

        <div className="notifications-notif-list">
          {filteredNotifs.length === 0 ? (
            <div className="notifications-empty-state">
              <FontAwesomeIcon icon={faBell} className="notifications-empty-icon" />
              <h3>Aucune notification</h3>
              <p>{filter === 'unread' ? 'Toutes vos notifications ont été lues' : 'Vous n\'avez aucune notification'}</p>
            </div>
          ) : (
            filteredNotifs.map(notif => (
              <div
                key={notif.id}
                className={`notifications-notif-item ${notif.read ? 'notifications-notif-item-read' : 'notifications-notif-item-unread'}`}
              >
                <div className="notifications-notif-icon" style={{ backgroundColor: `${getColor(notif.type)}20`, color: getColor(notif.type) }}>
                  <FontAwesomeIcon icon={getIcon(notif.type)} />
                </div>
                <div className="notifications-notif-content">
                  <div className="notifications-notif-header">
                    <h4 className="notifications-notif-title">{notif.title}</h4>
                    <span className="notifications-notif-date">{formatDate(notif.createdAt)}</span>
                  </div>
                  <p className="notifications-notif-message">{notif.message}</p>
                </div>
                {!notif.read && (
                  <button
                    className="notifications-mark-read-button"
                    onClick={() => markAsRead(notif.id)}
                    title="Marquer comme lu"
                  >
                    <FontAwesomeIcon icon={faCheck} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Notifications;