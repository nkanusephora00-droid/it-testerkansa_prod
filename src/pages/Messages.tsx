import React, { useEffect, useState } from 'react';
import { usersAPI, messagesAPI, User, profileAPI } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faPaperPlane, faCircle, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { createStyles } from '../shared/utils/styleUtils';
import Chat from '../components/Chat';

const Messages: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});
  const [showChat, setShowChat] = useState(false);

  const currentUserId = parseInt(localStorage.getItem('user_id') || '0');

  useEffect(() => {
    loadUsers();
    loadCurrentUser();
    loadUnreadCounts();
    // Poll for unread counts every 10 seconds
    const interval = setInterval(loadUnreadCounts, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUsers = async () => {
    try {
      const data: any = await usersAPI.getAvailable();
      const userList = Array.isArray(data) ? data : (data?.content || []);
      setUsers(userList);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUser = async () => {
    try {
      const data = await profileAPI.getMe();
      setCurrentUser(data);
    } catch (err) {
      console.error('Error loading current user:', err);
    }
  };

  const loadUnreadCounts = async () => {
    try {
      // Get actual unread counts from API grouped by sender
      const counts = await messagesAPI.getUnreadByUser();
      setUnreadCounts(counts);
    } catch (err) {
      console.error('Error loading unread counts:', err);
      // Fallback to empty counts
      setUnreadCounts({});
    }
  };

  const handleStartChat = (user: User) => {
    setSelectedUser(user);
    setShowChat(true);
    // Ensure current user is loaded
    if (!currentUser) {
      loadCurrentUser();
    }
    // Clear unread count for this user and reload unread counts
    setUnreadCounts(prev => ({ ...prev, [user.id]: 0 }));
    loadUnreadCounts();
  };

  const handleBackToList = () => {
    setShowChat(false);
  };

  const isMobile = window.innerWidth <= 768;

  // Mobile view: show either list or chat
  if (isMobile) {
    if (showChat && selectedUser) {
      return (
        <div style={styles.container}>
          <main style={styles.main}>
            <div style={styles.header}>
              <button style={styles.backButton} onClick={handleBackToList}>
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
              <h2 style={styles.pageTitle}>{selectedUser.username}</h2>
            </div>
            <div style={styles.chatArea}>
              <Chat
                currentUser={currentUser || { id: currentUserId, username: localStorage.getItem('username') || 'Utilisateur', email: '', role: localStorage.getItem('user_role') || 'utilisateur' }}
                selectedUser={selectedUser}
              />
            </div>
          </main>
        </div>
      );
    }
    return (
      <div style={styles.container}>
        <main style={styles.main}>
          <div style={styles.header}>
            <h2 style={styles.pageTitle}>
              <FontAwesomeIcon icon={faComments} /> Messages
            </h2>
          </div>
          <div style={styles.sidebar}>
            <div style={styles.sidebarHeader}>
              <h3 style={styles.sidebarTitle}>Conversations</h3>
            </div>
            {loading ? (
              <div style={styles.loading}>Chargement...</div>
            ) : users.length === 0 ? (
              <div style={styles.emptyState}>
                <FontAwesomeIcon icon={faComments} style={styles.emptyIcon} />
                <p>Aucun utilisateur disponible</p>
              </div>
            ) : (
              <div style={styles.usersList}>
                {users.map((user) => (
                  <div
                    key={user.id}
                    style={styles.userCard}
                    onClick={() => handleStartChat(user)}
                  >
                    <div style={styles.userInfo}>
                      <div style={styles.userAvatar}>
                        <FontAwesomeIcon icon={user.role === 'admin' ? faComments : faPaperPlane} />
                      </div>
                      <div style={styles.userDetails}>
                        <div style={styles.userName}>
                          {user.username}
                          {(unreadCounts[user.id] || 0) > 0 && (
                            <span style={styles.unreadBadge}>{unreadCounts[user.id]}</span>
                          )}
                        </div>
                        <div style={styles.userEmail}>{user.email}</div>
                      </div>
                    </div>
                    <div style={styles.userStatus}>
                      {user.isActive !== false ? (
                        <FontAwesomeIcon icon={faCircle} style={styles.onlineIndicator as any} />
                      ) : (
                        <FontAwesomeIcon icon={faCircle} style={styles.offlineIndicator as any} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Desktop view: show both list and chat
  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <div style={styles.header}>
          <h2 style={styles.pageTitle}>
            <FontAwesomeIcon icon={faComments} /> Messages
          </h2>
        </div>

        <div style={styles.chatContainer}>
          {/* Left sidebar - User list */}
          <div style={styles.sidebar}>
            <div style={styles.sidebarHeader}>
              <h3 style={styles.sidebarTitle}>Conversations</h3>
            </div>
            {loading ? (
              <div style={styles.loading}>Chargement...</div>
            ) : users.length === 0 ? (
              <div style={styles.emptyState}>
                <FontAwesomeIcon icon={faComments} style={styles.emptyIcon} />
                <p>Aucun utilisateur disponible</p>
              </div>
            ) : (
              <div style={styles.usersList}>
                {users.map((user) => (
                  <div
                    key={user.id}
                    style={{
                      ...styles.userCard,
                      ...(selectedUser?.id === user.id ? styles.userCardSelected : {})
                    }}
                    onClick={() => handleStartChat(user)}
                  >
                    <div style={styles.userInfo}>
                      <div style={styles.userAvatar}>
                        <FontAwesomeIcon icon={user.role === 'admin' ? faComments : faPaperPlane} />
                      </div>
                      <div style={styles.userDetails}>
                        <div style={styles.userName}>
                          {user.username}
                          {(unreadCounts[user.id] || 0) > 0 && (
                            <span style={styles.unreadBadge}>{unreadCounts[user.id]}</span>
                          )}
                        </div>
                        <div style={styles.userEmail}>{user.email}</div>
                      </div>
                    </div>
                    <div style={styles.userStatus}>
                      {user.isActive !== false ? (
                        <FontAwesomeIcon icon={faCircle} style={styles.onlineIndicator as any} />
                      ) : (
                        <FontAwesomeIcon icon={faCircle} style={styles.offlineIndicator as any} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right side - Chat area */}
          <div style={styles.chatArea}>
            {selectedUser ? (
              <Chat
                currentUser={currentUser || { id: currentUserId, username: localStorage.getItem('username') || 'Utilisateur', email: '', role: localStorage.getItem('user_role') || 'utilisateur' }}
                selectedUser={selectedUser}
              />
            ) : (
              <div style={styles.noChatSelected}>
                <FontAwesomeIcon icon={faComments} style={styles.noChatIcon} />
                <h3>Sélectionnez une conversation</h3>
                <p>Choisissez un utilisateur pour commencer à discuter</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const styles = createStyles({
  container: {
    backgroundColor: 'var(--bg-primary)',
    minHeight: '100vh',
  },
  main: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
    minHeight: 'calc(100vh - 70px)',
  },
  header: {
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  pageTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  backButton: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'var(--hover-bg)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
  },
  chatContainer: {
    display: 'flex',
    gap: '20px',
    height: 'calc(100vh - 140px)',
  },
  sidebar: {
    width: '350px',
    backgroundColor: 'var(--bg-card)',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  sidebarHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid var(--border-color)',
  },
  sidebarTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  loading: {
    textAlign: 'center' as const,
    color: 'var(--text-secondary)',
    padding: '40px',
  },
  emptyState: {
    textAlign: 'center' as const,
    color: 'var(--text-secondary)',
    padding: '60px 20px',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    opacity: 0.5,
  } as any,
  usersList: {
    flex: 1,
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0',
  },
  userCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.2s',
    borderBottom: '1px solid var(--border-color)',
  } as React.CSSProperties,
  userCardSelected: {
    backgroundColor: 'var(--hover-bg)',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'var(--info-color)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
  } as React.CSSProperties,
  userDetails: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  userName: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  unreadBadge: {
    backgroundColor: 'var(--danger-color)',
    color: 'white',
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '10px',
  },
  userEmail: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  userStatus: {
    display: 'flex',
    alignItems: 'center',
  },
  onlineIndicator: {
    fontSize: '8px',
    color: 'var(--success-color)',
  } as any,
  offlineIndicator: {
    fontSize: '8px',
    color: 'var(--text-muted)',
  } as any,
  chatArea: {
    flex: 1,
    backgroundColor: 'var(--bg-card)',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    overflow: 'hidden',
  },
  noChatSelected: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--text-secondary)',
  },
  noChatIcon: {
    fontSize: '64px',
    marginBottom: '20px',
    opacity: 0.3,
  },
});

export default Messages;
