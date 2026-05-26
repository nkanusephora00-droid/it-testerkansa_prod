import React, { useEffect, useState } from 'react';
import { usersAPI, messagesAPI, User, profileAPI } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faPaperPlane, faCircle, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Chat from '../components/Chat';
import '../styles/pages/Messages.css';

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
        <div className="messages-container">
          <main className="messages-main">
            <div className="messages-header">
              <button className="messages-back-button" onClick={handleBackToList}>
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
              <h2 className="messages-page-title">{selectedUser.username}</h2>
            </div>
            <div className="messages-chat-area">
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
      <div className="messages-container">
        <main className="messages-main">
          <div className="messages-header">
            <h2 className="messages-page-title">
              <FontAwesomeIcon icon={faComments} /> Messages
            </h2>
          </div>
          <div className="messages-sidebar">
            <div className="messages-sidebar-header">
              <h3 className="messages-sidebar-title">Conversations</h3>
            </div>
            {loading ? (
              <div className="messages-loading">Chargement...</div>
            ) : users.length === 0 ? (
              <div className="messages-empty-state">
                <FontAwesomeIcon icon={faComments} className="messages-empty-icon" />
                <p>Aucun utilisateur disponible</p>
              </div>
            ) : (
              <div className="messages-users-list">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="messages-user-card"
                    onClick={() => handleStartChat(user)}
                  >
                    <div className="messages-user-info">
                      <div className="messages-user-avatar">
                        <FontAwesomeIcon icon={user.role === 'admin' ? faComments : faPaperPlane} />
                      </div>
                      <div className="messages-user-details">
                        <div className="messages-user-name">
                          {user.username}
                          {(unreadCounts[user.id] || 0) > 0 && (
                            <span className="messages-unread-badge">{unreadCounts[user.id]}</span>
                          )}
                        </div>
                        <div className="messages-user-email">{user.email}</div>
                      </div>
                    </div>
                    <div className="messages-user-status">
                      {user.isActive !== false ? (
                        <FontAwesomeIcon icon={faCircle} className="messages-online-indicator" />
                      ) : (
                        <FontAwesomeIcon icon={faCircle} className="messages-offline-indicator" />
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
    <div className="messages-container">
      <main className="messages-main">
        <div className="messages-header">
          <h2 className="messages-page-title">
            <FontAwesomeIcon icon={faComments} /> Messages
          </h2>
        </div>

        <div className="messages-chat-container">
          {/* Left sidebar - User list */}
          <div className="messages-sidebar">
            <div className="messages-sidebar-header">
              <h3 className="messages-sidebar-title">Conversations</h3>
            </div>
            {loading ? (
              <div className="messages-loading">Chargement...</div>
            ) : users.length === 0 ? (
              <div className="messages-empty-state">
                <FontAwesomeIcon icon={faComments} className="messages-empty-icon" />
                <p>Aucun utilisateur disponible</p>
              </div>
            ) : (
              <div className="messages-users-list">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className={`messages-user-card ${selectedUser?.id === user.id ? 'messages-user-card-selected' : ''}`}
                    onClick={() => handleStartChat(user)}
                  >
                    <div className="messages-user-info">
                      <div className="messages-user-avatar">
                        <FontAwesomeIcon icon={user.role === 'admin' ? faComments : faPaperPlane} />
                      </div>
                      <div className="messages-user-details">
                        <div className="messages-user-name">
                          {user.username}
                          {(unreadCounts[user.id] || 0) > 0 && (
                            <span className="messages-unread-badge">{unreadCounts[user.id]}</span>
                          )}
                        </div>
                        <div className="messages-user-email">{user.email}</div>
                      </div>
                    </div>
                    <div className="messages-user-status">
                      {user.isActive !== false ? (
                        <FontAwesomeIcon icon={faCircle} className="messages-online-indicator" />
                      ) : (
                        <FontAwesomeIcon icon={faCircle} className="messages-offline-indicator" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right side - Chat area */}
          <div className="messages-chat-area">
            {selectedUser ? (
              <Chat
                currentUser={currentUser || { id: currentUserId, username: localStorage.getItem('username') || 'Utilisateur', email: '', role: localStorage.getItem('user_role') || 'utilisateur' }}
                selectedUser={selectedUser}
              />
            ) : (
              <div className="messages-no-chat-selected">
                <FontAwesomeIcon icon={faComments} className="messages-no-chat-icon" />
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

export default Messages;
