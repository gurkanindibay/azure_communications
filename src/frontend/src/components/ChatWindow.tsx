import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Paper,
  CircularProgress,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import type { ChatThread, Message } from '../types';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { MessageType } from '../types';
import { useAcsChat } from '../hooks/useAcsChat';

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface ChatWindowProps {
  thread: ChatThread | null;
  onMessageSent?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ thread, onMessageSent }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [acsToken, setAcsToken] = useState<string | null>(null);
  const [acsEndpoint, setAcsEndpoint] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to get ACS token
  const getAcsToken = useCallback(async () => {
    try {
      const response = await apiService.getAcsToken();
      setAcsToken(response.token);
      setAcsEndpoint(response.endpoint);
      return response.token;
    } catch (error) {
      console.error('Error getting ACS token:', error);
      return null;
    }
  }, []);

  // Handle incoming messages from ACS
  const handleMessageReceived = useCallback((event: any) => {
    console.log('New message received via ACS:', event);
    
    // Convert ACS message to our Message format
    const message: Message = {
      id: event.message.id,
      chatThreadId: thread?.id || '',
      senderId: event.sender.id,
      content: event.message.content.message,
      type: MessageType.Text,
      sentAt: event.message.createdOn,
      isDeleted: false,
    };
    
    // Only add the message if it belongs to the current thread
    if (thread && message.chatThreadId === thread.id) {
      setMessages((prev) => {
        // Avoid duplicates by checking if message already exists
        const exists = prev.some((m) => m.id === message.id);
        if (exists) return prev;
        
        return [...prev, message];
      });
      
      // Mark as read if it's not from the current user
      if (user && message.senderId !== user.id) {
        // Debounce mark as read to avoid excessive API calls
        debouncedMarkAsRead(thread.id, user.id);
      }
    }
  }, [thread, user]);

  // Debounced mark as read function
  const debouncedMarkAsRead = useCallback(
    debounce(async (threadId: string, userId: string) => {
      try {
        await apiService.markMessagesAsRead(threadId, userId);
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }, 1000), // 1 second debounce
    []
  );

  // Set up ACS chat connection
  const {
    isConnected: acsConnected,
    initializeChat,
    sendMessage: acsSendMessage,
  } = useAcsChat({
    threadId: thread?.id,
    onMessageReceived: handleMessageReceived,
  });

  useEffect(() => {
    if (thread) {
      loadMessages();
      markAsRead();
      // Initialize ACS chat if not already connected
      if (!acsConnected && !acsToken) {
        getAcsToken().then(token => {
          if (token && acsEndpoint) {
            initializeChat(token, acsEndpoint);
          }
        });
      }
    } else {
      setMessages([]);
    }
  }, [thread?.id]); // Only depend on thread ID to prevent excessive re-runs

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    if (!thread) return;

    try {
      setLoading(true);
      const threadMessages = await apiService.getThreadMessages(thread.id);
      setMessages(threadMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!thread || !user) return;

    try {
      await apiService.markMessagesAsRead(thread.id, user.id);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!thread || !user || !newMessage.trim()) return;

    try {
      setSending(true);
      
      if (acsConnected) {
        // Use ACS for real-time messaging
        await acsSendMessage(newMessage.trim());
      } else {
        // Fallback to API if ACS not connected
        await apiService.sendMessage(user.id, {
          chatThreadId: thread.id,
          content: newMessage.trim(),
          type: MessageType.Text,
        });
      }
      
      setNewMessage('');
      onMessageSent?.();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  if (!thread) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h6" color="text.secondary">
          Select a conversation to start chatting
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Avatar alt={thread.otherUser?.displayName} src={thread.otherUser?.avatarUrl}>
          {thread.otherUser?.displayName.charAt(0).toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="subtitle1">{thread.otherUser?.displayName}</Typography>
          <Typography variant="caption" color="text.secondary">
            {thread.otherUser?.isOnline ? 'Online' : 'Offline'}
          </Typography>
        </Box>
      </Box>

      {/* Messages Area */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId === user?.id;
            
            return (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    maxWidth: '70%',
                    bgcolor: isOwnMessage ? 'primary.main' : 'grey.100',
                    color: isOwnMessage ? 'white' : 'text.primary',
                  }}
                >
                  <Typography variant="body1">{message.content}</Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 0.5,
                      opacity: 0.8,
                      textAlign: 'right',
                    }}
                  >
                    {formatDistanceToNow(new Date(message.sentAt), {
                      addSuffix: true,
                    })}
                  </Typography>
                </Paper>
              </Box>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Message Input */}
      <Box
        component="form"
        onSubmit={handleSendMessage}
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          gap: 1,
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sending}
        />
        <IconButton
          type="submit"
          color="primary"
          disabled={!newMessage.trim() || sending}
        >
          {sending ? <CircularProgress size={24} /> : <SendIcon />}
        </IconButton>
      </Box>
    </Box>
  );
};
