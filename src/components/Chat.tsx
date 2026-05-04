import React, { useState, useEffect, useRef } from 'react';
import { messagesAPI, Message, User } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';

interface ChatProps {
  currentUser: User;
  selectedUser: User;
}

const Chat: React.FC<ChatProps> = ({ currentUser, selectedUser }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadMessages();
    // Poll for new messages every 5 seconds
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser.id]);

  const loadMessages = async () => {
    try {
      const data = await messagesAPI.getConversation(selectedUser.id);
      setMessages(data);
      
      // Mark unread messages as read
      const unreadMessages = data.filter(m => !m.read && m.receiverId === currentUser.id);
      for (const msg of unreadMessages) {
        await messagesAPI.markAsRead(msg.id);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await messagesAPI.create({
        receiverId: selectedUser.id,
        content: newMessage.trim()
      });
      setNewMessage('');
      await loadMessages();
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const isOwnMessage = (message: Message) => message.senderId === currentUser.id;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerInfo}>
          <h3 style={styles.headerTitle}>{selectedUser.username}</h3>
          <span style={styles.headerRole}>{selectedUser.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</span>
        </div>
      </div>

      <div style={styles.messagesContainer}>
        {loading ? (
          <div style={styles.loading}>Chargement...</div>
        ) : messages.length === 0 ? (
          <div style={styles.emptyState}>
            <p>Aucun message. Commencez la conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  ...styles.message,
                  ...(isOwnMessage(message) ? styles.ownMessage : styles.otherMessage)
                }}
              >
                <div style={styles.messageContent}>
                  <span style={styles.messageSender}>
                    {isOwnMessage(message) ? 'Vous' : message.senderUsername}
                  </span>
                  <p style={styles.messageText}>{message.content}</p>
                  <span style={styles.messageTime}>{formatTime(message.timestamp)}</span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <form onSubmit={handleSendMessage} style={styles.inputContainer}>
        <input
          type="text"
          placeholder="Écrivez votre message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          style={styles.input}
          disabled={sending}
        />
        <button
          type="submit"
          style={styles.sendButton}
          disabled={!newMessage.trim() || sending}
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </form>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    backgroundColor: 'var(--bg-card)',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-card)',
  },
  headerInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  headerTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  headerRole: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    backgroundColor: 'var(--bg-primary)',
  },
  loading: {
    textAlign: 'center' as const,
    color: 'var(--text-secondary)',
    padding: '20px',
  },
  emptyState: {
    textAlign: 'center' as const,
    color: 'var(--text-secondary)',
    padding: '40px 20px',
  },
  message: {
    maxWidth: '65%',
    padding: '12px 16px',
    borderRadius: '18px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  ownMessage: {
    alignSelf: 'flex-start' as const,
    backgroundColor: '#4CAF50',
    color: 'white',
    borderBottomLeftRadius: '4px',
  },
  otherMessage: {
    alignSelf: 'flex-end' as const,
    backgroundColor: '#2196F3',
    color: 'white',
    borderBottomRightRadius: '4px',
  },
  messageContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  messageSender: {
    fontSize: '12px',
    fontWeight: 600,
    opacity: 0.9,
    marginBottom: '2px',
  },
  messageText: {
    margin: 0,
    fontSize: '15px',
    lineHeight: '1.4',
    wordBreak: 'break-word' as const,
  },
  messageTime: {
    fontSize: '11px',
    opacity: 0.7,
    alignSelf: 'flex-end' as const,
    marginTop: '4px',
  },
  inputContainer: {
    display: 'flex',
    gap: '12px',
    padding: '16px 24px',
    borderTop: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-card)',
  },
  input: {
    flex: 1,
    padding: '12px 20px',
    border: '1px solid var(--border-color)',
    borderRadius: '24px',
    fontSize: '15px',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
  },
  sendButton: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#007AFF',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
};

export default Chat;
