import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faTimes, faCheck, faExclamationTriangle, faInfoCircle, faCheckCircle, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { messagesAPI, todosAPI, testsAPI, systemNotificationsAPI } from '../services/api';
import './NotificationBell.css';

// Hook pour détecter la taille d'écran
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'message';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  senderId?: number;
  senderUsername?: string;
}

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const isMobile = useResponsive();

  // Charger les notifications depuis le backend
  useEffect(() => {
    fetchNotifications();
    
    // Rafraîchir automatiquement toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const [messages, todos, tests, systemNotifications] = await Promise.all([
        messagesAPI.getAll(),
        todosAPI.getAll(),
        testsAPI.getAll(),
        systemNotificationsAPI.getAll()
      ]);

      const allNotifications: Notification[] = [];

      // Ajouter les messages non lus comme notifications
      messages.forEach((message: any) => {
        allNotifications.push({
          id: `msg_${message.id}`,
          title: `Message de ${message.senderUsername}`,
          message: message.content,
          type: 'message',
          timestamp: new Date(message.timestamp),
          read: message.read,
          actionUrl: '/messages',
          senderId: message.senderId,
          senderUsername: message.senderUsername
        });
      });

      // Ajouter les notifications système
      systemNotifications.forEach((notif: any) => {
        allNotifications.push({
          id: `sys_${notif.id}`,
          title: notif.title,
          message: notif.message,
          type: notif.type.toLowerCase() as Notification['type'],
          timestamp: new Date(notif.createdAt),
          read: notif.read,
          actionUrl: notif.actionUrl
        });
      });

      // Ajouter les tâches en attente
      todos.filter((t: any) => !t.completed).forEach((todo: any) => {
        allNotifications.push({
          id: `todo_${todo.id}`,
          title: 'Tâche en attente',
          message: todo.title,
          type: 'warning',
          timestamp: new Date(todo.createdAt),
          read: false,
          actionUrl: '/todos'
        });
      });

      // Ajouter les tests avec des problèmes
      tests.filter((t: any) => t.statut === 'BUG').forEach((test: any) => {
        allNotifications.push({
          id: `test_bug_${test.id}`,
          title: 'BUG détecté',
          message: `Test "${test.fonction}" - Statut: BUG`,
          type: 'error',
          timestamp: new Date(test.createdAt || Date.now()),
          read: false,
          actionUrl: '/tests'
        });
      });

      tests.filter((t: any) => t.statut === 'EN COURS').forEach((test: any) => {
        allNotifications.push({
          id: `test_progress_${test.id}`,
          title: 'Test en cours',
          message: `Test "${test.fonction}" - En cours de vérification`,
          type: 'info',
          timestamp: new Date(test.createdAt || Date.now()),
          read: false,
          actionUrl: '/tests'
        });
      });

      // Trier par date (plus récent en premier)
      allNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setNotifications(allNotifications);
      setUnreadCount(allNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

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

  const markAsRead = async (notificationId: string) => {
    try {
      // Si c'est un message, utiliser l'API messages
      if (notificationId.startsWith('msg_')) {
        const messageId = parseInt(notificationId.replace('msg_', ''));
        await messagesAPI.markAsRead(messageId);
      }
      // Si c'est une notification système, utiliser l'API systemNotifications
      else if (notificationId.startsWith('sys_')) {
        const notifId = parseInt(notificationId.replace('sys_', ''));
        await systemNotificationsAPI.markAsRead(notifId);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }

    // Mettre à jour l'état local
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    try {
      // Marquer tous les messages comme lus via l'API
      const messageNotifications = notifications.filter(n => n.id.startsWith('msg_'));
      for (const notification of messageNotifications) {
        const messageId = parseInt(notification.id.replace('msg_', ''));
        await messagesAPI.markAsRead(messageId);
      }

      // Marquer toutes les notifications système comme lues via l'API
      const systemNotifs = notifications.filter(n => n.id.startsWith('sys_'));
      for (const notification of systemNotifs) {
        const notifId = parseInt(notification.id.replace('sys_', ''));
        await systemNotificationsAPI.markAsRead(notifId);
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }

    // Mettre à jour l'état local
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
      case 'message': return faEnvelope;
      default: return faInfoCircle;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return '#27ae60';
      case 'warning': return '#f39c12';
      case 'error': return '#e74c3c';
      case 'info': return '#3498db';
      case 'message': return '#9b59b6';
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
        style={{
          ...styles.bellButton,
          ...(isMobile ? {
            width: "36px",
            height: "36px",
            backgroundColor: "rgba(52, 152, 219, 0.1)",
            border: "2px solid rgba(52, 152, 219, 0.3)",
            boxShadow: "0 2px 8px rgba(52, 152, 219, 0.2)",
            fontSize: "14px"
          } : {})
        }}
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        <FontAwesomeIcon 
          icon={faBell} 
          className="notification-bell-icon"
          style={{
            ...(isMobile ? {
              color: "var(--info-color)",
              fontSize: "14px"
            } : {})
          }}
        />
        {unreadCount > 0 && (
          <span style={{
            ...styles.badge,
            ...(isMobile ? {
              width: "18px",
              height: "18px",
              fontSize: "10px",
              right: "-4px",
              top: "-4px",
              backgroundColor: "var(--danger-color)",
              border: "2px solid white"
            } : {})
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          ...styles.dropdown,
          ...(isMobile ? {
            right: "-10px",
            top: "45px",
            width: "320px",
            maxWidth: "90vw",
            maxHeight: "70vh",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            border: "1px solid var(--border-light)"
          } : {})
        }}>
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

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    display: 'inline-block',
  },
  bellButton: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'var(--hover-bg)' as any,
    color: 'var(--text-secondary)' as any,
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
    border: '2px solid var(--bg-card)' as any,
  },
  dropdown: {
    position: 'absolute',
    top: '50px',
    right: '0',
    width: '350px',
    maxHeight: '400px',
    backgroundColor: 'var(--bg-card)' as any,
    border: '1px solid var(--border-color)' as any,
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
    borderBottom: '1px solid var(--border-color)' as any,
    backgroundColor: 'var(--hover-bg)' as any,
  },
  dropdownTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--text-primary)' as any,
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
    backgroundColor: 'var(--hover-bg)' as any,
    color: 'var(--text-secondary)' as any,
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
    color: 'var(--text-secondary)' as any,
  },
  emptyText: {
    margin: 0,
    fontSize: '14px',
  },
  notificationItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 20px',
    borderBottom: '1px solid var(--border-light)' as any,
    transition: 'background-color 0.2s ease',
  },
  notificationUnread: {
    backgroundColor: 'var(--hover-bg)' as any,
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
    backgroundColor: 'var(--hover-bg)' as any,
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
    color: 'var(--text-primary)' as any,
    margin: '0 0 4px 0',
    lineHeight: '1.3',
  },
  notificationMessage: {
    fontSize: '13px',
    color: 'var(--text-secondary)' as any,
    margin: '0 0 4px 0',
    lineHeight: '1.4',
  },
  notificationTime: {
    fontSize: '11px',
    color: 'var(--text-muted)' as any,
    margin: 0,
  },
  deleteButton: {
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--text-muted)' as any,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  },
  dropdownFooter: {
    padding: '12px 20px',
    borderTop: '1px solid var(--border-color)' as any,
    backgroundColor: 'var(--hover-bg)' as any,
  },
  viewAllButton: {
    width: '100%',
    padding: '8px 16px',
    border: '1px solid var(--border-color)' as any,
    borderRadius: '6px',
    backgroundColor: 'var(--bg-card)' as any,
    color: 'var(--text-primary)' as any,
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};

export default NotificationBell;
