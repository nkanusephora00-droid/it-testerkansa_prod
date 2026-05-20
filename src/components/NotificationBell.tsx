import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faTimes, faCheck, faExclamationTriangle, faInfoCircle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { createStyles } from '../shared/utils/styleUtils';
import './NotificationBell.css';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Simuler des notifications initiales
  useEffect(() => {
    const initialNotifications: Notification[] = [
      {
        id: '1',
        title: 'Nouvelle session de test',
        message: 'La session "Tests Release v2.0" a été créée avec succès',
        type: 'success',
        timestamp: new Date(Date.now() - 1000 * 60 * 5), // Il y a 5 minutes
        read: false,
        actionUrl: '/tests'
      },
      {
        id: '2',
        title: 'Rappel de tâche',
        message: 'Vous avez 3 tâches en attente de validation',
        type: 'warning',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // Il y a 30 minutes
        read: false,
        actionUrl: '/todos'
      },
      {
        id: '3',
        title: 'Message reçu',
        message: 'Vous avez reçu un nouveau message de l\'administrateur',
        type: 'info',
        timestamp: new Date(Date.now() - 1000 * 60 * 60), // Il y a 1 heure
        read: true,
        actionUrl: '/messages'
      }
    ];
    
    setNotifications(initialNotifications);
    setUnreadCount(initialNotifications.filter(n => !n.read).length);
  }, []);

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const deleteNotification = (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    setIsOpen(false);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return faCheckCircle;
      case 'warning': return faExclamationTriangle;
      case 'error': return faTimes;
      case 'info': return faInfoCircle;
      default: return faInfoCircle;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return '#27ae60';
      case 'warning': return '#f39c12';
      case 'error': return '#e74c3c';
      case 'info': return '#3498db';
      default: return '#3498db';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div style={styles.container} ref={dropdownRef}>
      <button
        style={styles.bellButton}
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        <FontAwesomeIcon icon={faBell} className="notification-bell-icon" />
        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div style={styles.dropdown}>
          <div style={styles.dropdownHeader}>
            <h3 style={styles.dropdownTitle}>Notifications</h3>
            <div style={styles.headerActions}>
              {unreadCount > 0 && (
                <button
                  style={styles.markAllReadButton}
                  onClick={markAllAsRead}
                  title="Tout marquer comme lu"
                >
                  <FontAwesomeIcon icon={faCheck} className="action-icon" />
                </button>
              )}
              <button
                style={styles.closeButton}
                onClick={() => setIsOpen(false)}
                title="Fermer"
              >
                <FontAwesomeIcon icon={faTimes} className="action-icon" />
              </button>
            </div>
          </div>

          <div style={styles.notificationsList}>
            {notifications.length === 0 ? (
              <div style={styles.emptyState}>
                <FontAwesomeIcon icon={faBell} className="empty-icon" />
                <p style={styles.emptyText}>Aucune notification</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  style={{
                    ...styles.notificationItem,
                    ...(notification.read ? styles.notificationRead : styles.notificationUnread)
                  }}
                >
                  <button
                    style={styles.notificationContent}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div style={styles.notificationIconContainer}>
                      <FontAwesomeIcon
                        icon={getNotificationIcon(notification.type)}
                        className="notification-icon"
                        style={{
                          color: getNotificationColor(notification.type)
                        }}
                      />
                    </div>
                    <div style={styles.notificationText}>
                      <div style={styles.notificationTitle}>{notification.title}</div>
                      <div style={styles.notificationMessage}>{notification.message}</div>
                      <div style={styles.notificationTime}>
                        {formatTimestamp(notification.timestamp)}
                      </div>
                    </div>
                  </button>
                  <button
                    style={styles.deleteButton}
                    onClick={() => deleteNotification(notification.id)}
                    title="Supprimer"
                  >
                    <FontAwesomeIcon icon={faTimes} className="delete-icon" />
                  </button>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div style={styles.dropdownFooter}>
              <button
                style={styles.viewAllButton}
                onClick={() => {
                  navigate('/notifications');
                  setIsOpen(false);
                }}
              >
                Voir toutes les notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = createStyles({
  container: {
    position: 'relative',
    display: 'inline-block',
  },
  bellButton: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'var(--hover-bg)',
    color: 'var(--text-secondary)',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    backgroundColor: 'var(--danger-color)' as any,
    color: 'white',
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 6px',
    borderRadius: '10px',
    minWidth: '18px',
    height: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid var(--bg-card)',
  },
  dropdown: {
    position: 'absolute',
    top: '50px',
    right: '0',
    width: '350px',
    maxHeight: '400px',
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
    zIndex: 1000,
    overflow: 'hidden',
  },
  dropdownHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid var(--border-color)',
    backgroundColor: 'var(--hover-bg)',
  },
  dropdownTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
  },
  markAllReadButton: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'var(--success-color)' as any,
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  closeButton: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'var(--hover-bg)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  notificationsList: {
    maxHeight: '300px',
    overflowY: 'auto',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    color: 'var(--text-secondary)',
  },
  emptyText: {
    margin: 0,
    fontSize: '14px',
  },
  notificationItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 20px',
    borderTop: '1px solid var(--border-color)',
    transition: 'background-color 0.2s ease',
  },
  notificationUnread: {
    backgroundColor: 'var(--hover-bg)',
  },
  notificationRead: {
    backgroundColor: 'transparent',
  },
  notificationContent: {
    flex: 1,
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    padding: '0',
    textAlign: 'left',
  },
  notificationIconContainer: {
    flexShrink: 0,
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'var(--hover-bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIcon: {
    fontSize: '14px',
  },
  notificationText: {
    flex: 1,
    minWidth: 0,
  },
  notificationTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    margin: '0 0 4px 0',
    lineHeight: '1.3',
  },
  notificationMessage: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    margin: '0 0 4px 0',
    lineHeight: '1.4',
  },
  notificationTime: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    margin: 0,
  },
  deleteButton: {
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  },
  dropdownFooter: {
    padding: '12px 20px',
    borderTop: '1px solid var(--border-color)',
    backgroundColor: 'var(--hover-bg)',
  },
  viewAllButton: {
    width: '100%',
    padding: '8px 16px',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-primary)',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
});

export default NotificationBell;
