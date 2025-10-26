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
import { useSignalRChat } from '../hooks/useChatClient';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle incoming messages from SignalR
  const handleMessageReceived = useCallback((message: Message) => {
    console.log('New message received:', message);
    
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
        apiService.markMessagesAsRead(message.chatThreadId, user.id).catch(console.error);
      }
    }
  }, [thread, user]);

  // Set up SignalR connection
  useSignalRChat({
    threadId: thread?.id,
    onMessageReceived: handleMessageReceived,
  });

  useEffect(() => {
    if (thread) {
      loadMessages();
      markAsRead();
    } else {
      setMessages([]);
    }
  }, [thread]);

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
      await apiService.sendMessage(user.id, {
        chatThreadId: thread.id,
        content: newMessage.trim(),
        type: MessageType.Text,
      });
      
      // No need to manually add message to state - SignalR will handle it
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
