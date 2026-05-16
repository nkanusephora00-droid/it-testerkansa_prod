import React, { useState, useEffect, useRef } from 'react';
import { messagesAPI, Message, User } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import '../styles/components/Chat.css';

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
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-info">
          <h3 className="chat-header-title">{selectedUser.username}</h3>
          <span className="chat-header-role">{selectedUser.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</span>
        </div>
      </div>

      <div className="chat-messages-container">
        {loading ? (
          <div className="chat-loading">Chargement...</div>
        ) : messages.length === 0 ? (
          <div className="chat-empty-state">
            <p>Aucun message. Commencez la conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-message ${isOwnMessage(message) ? 'chat-own-message' : 'chat-other-message'}`}
              >
                <div className="chat-message-content">
                  <span className="chat-message-sender">
                    {isOwnMessage(message) ? 'Vous' : message.senderUsername}
                  </span>
                  <p className="chat-message-text">{message.content}</p>
                  <span className="chat-message-time">{formatTime(message.timestamp)}</span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-container">
        <input
          type="text"
          placeholder="Écrivez votre message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="chat-input"
          disabled={sending}
        />
        <button
          type="submit"
          className="chat-send-button"
          disabled={!newMessage.trim() || sending}
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </form>
    </div>
  );
};

export default Chat;
