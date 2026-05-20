import React, { useEffect, useState } from 'react';
import { testsAPI, todosAPI } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faCheck, faExclamationTriangle, faInfo, faCheckCircle, faBug } from '@fortawesome/free-solid-svg-icons';
import { createStyles } from '../shared/utils/styleUtils';

interface Notification {
  id: number;
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
          id: todo.id + 1000,
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
          id: test.id + 2000,
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
          id: test.id + 3000,
          type: 'warning',
          title: 'Test en cours',
          message: `Test "${test.fonction}" - En cours de vérification`,
          read: false,
          createdAt: (test as any).createdAt || new Date().toISOString(),
          link: '/tests'
        });
      });

      notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Restaurer le statut "read" depuis localStorage
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

  const markAsRead = (id: number) => {
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
    return <div style={styles.loading}>Chargement...</div>;
  }

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.pageTitle}>
              <FontAwesomeIcon icon={faBell} /> Notifications
            </h2>
            <p style={styles.pageSubtitle}>
              {unreadCount > 0 ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}` : 'Toutes lues'}
            </p>
          </div>
          <div style={styles.headerActions}>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}
              style={styles.filterSelect}
            >
              <option value="all">Toutes</option>
              <option value="unread">Non lues</option>
            </select>
            {unreadCount > 0 && (
              <button style={styles.markAllButton} onClick={markAllAsRead}>
                <FontAwesomeIcon icon={faCheck} /> Tout marquer comme lu
              </button>
            )}
          </div>
        </div>

        <div style={styles.notifList}>
          {filteredNotifs.length === 0 ? (
            <div style={styles.emptyState}>
              <FontAwesomeIcon icon={faBell} style={styles.emptyIcon} />
              <h3>Aucune notification</h3>
              <p>{filter === 'unread' ? 'Toutes vos notifications ont été lues' : 'Vous n\'avez aucune notification'}</p>
            </div>
          ) : (
            filteredNotifs.map(notif => (
              <div
                key={notif.id}
                style={{
                  ...styles.notifItem,
                  ...(notif.read ? styles.notifItemRead : styles.notifItemUnread)
                }}
              >
                <div style={{ ...styles.notifIcon, backgroundColor: `${getColor(notif.type)}20`, color: getColor(notif.type) }}>
                  <FontAwesomeIcon icon={getIcon(notif.type)} />
                </div>
                <div style={styles.notifContent}>
                  <div style={styles.notifHeader}>
                    <h4 style={styles.notifTitle}>{notif.title}</h4>
                    <span style={styles.notifDate}>{formatDate(notif.createdAt)}</span>
                  </div>
                  <p style={styles.notifMessage}>{notif.message}</p>
                </div>
                {!notif.read && (
                  <button
                    style={styles.markReadButton}
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

const styles = createStyles({
  container: { backgroundColor: 'var(--bg-primary)', minHeight: '100vh' },
  main: { padding: '30px', maxWidth: '900px', margin: '0 auto', width: '100%', minHeight: 'calc(100vh - 70px)' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--text-secondary)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' },
  pageTitle: { margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' },
  pageSubtitle: { margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' },
  headerActions: { display: 'flex', gap: '12px', alignItems: 'center' },
  filterSelect: { padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '13px', cursor: 'pointer' },
  markAllButton: { padding: '8px 16px', backgroundColor: 'var(--success-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' },
  notifList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  emptyState: { textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' },
  emptyIcon: { fontSize: '48px', marginBottom: '16px', opacity: 0.5 } as any,
  notifItem: { display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', transition: 'all 0.2s' },
  notifItemUnread: { borderLeftWidth: '4px', borderLeftColor: 'var(--info-color)', borderLeftStyle: 'solid' },
  notifItemRead: { opacity: 0.7 },
  notifIcon: { width: '44px', height: '44px', minWidth: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' },
  notifContent: { flex: 1 },
  notifHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
  notifTitle: { margin: 0, fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' },
  notifDate: { fontSize: '12px', color: 'var(--text-muted)' },
  notifMessage: { margin: 0, fontSize: '13px', color: 'var(--text-secondary)' },
  markReadButton: { width: '32px', height: '32px', minWidth: '32px', borderRadius: '50%', border: '1px solid var(--success-color)', backgroundColor: 'transparent', color: 'var(--success-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', transition: 'all 0.2s' }
});

export default Notifications;