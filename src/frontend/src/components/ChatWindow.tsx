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
  const { user, acsToken, acsEndpoint } = useAuth(); // Get ACS token from AuthContext
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initAttemptedRef = useRef(false); // Track if we've attempted initialization

  // Handle incoming messages from ACS
  const handleMessageReceived = useCallback((event: any) => {
    console.log('New message received via ACS:', event);
    
    // Convert ACS message to our Message format
    const message: Message = {
      id: event.message.id,
      chatThreadId: thread?.azureCommunicationThreadId || '',
      senderId: event.sender.id,
      content: event.message.content.message,
      type: MessageType.Text,
      sentAt: event.message.createdOn,
      isDeleted: false,
    };
    
    // Only add the message if it belongs to the current thread
    if (thread && message.chatThreadId === thread.azureCommunicationThreadId) {
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
    isConnecting: acsConnecting,
    error: acsError,
    initializeChat,
    sendMessage: acsSendMessage,
  } = useAcsChat({
    threadId: thread?.azureCommunicationThreadId,
    onMessageReceived: handleMessageReceived,
  });

  // Initialize ACS connection once when token is available
  useEffect(() => {
    console.log('ChatWindow: ACS initialization check', {
      acsConnected,
      acsConnecting,
      hasAcsToken: !!acsToken,
      hasAcsEndpoint: !!acsEndpoint,
      initAttempted: initAttemptedRef.current
    });
    
    if (!acsConnected && !acsConnecting && acsToken && acsEndpoint && !initAttemptedRef.current) {
      console.log('ChatWindow: Starting ACS initialization...', { 
        hasToken: !!acsToken, 
        tokenLength: acsToken?.length,
        endpoint: acsEndpoint 
      });
      initAttemptedRef.current = true; // Mark that we've attempted initialization
      initializeChat(acsToken, acsEndpoint);
    }
  }, [acsToken, acsEndpoint, acsConnected, acsConnecting]); // Don't include initializeChat to avoid loop

  // Load messages when thread changes
  useEffect(() => {
    if (thread) {
      loadMessages();
      markAsRead();
    } else {
      setMessages([]);
    }
  }, [thread?.id]); // Only depend on thread ID

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
      
      if (!acsConnected) {
        console.error('ACS not connected. Token:', !!acsToken, 'Endpoint:', !!acsEndpoint);
        throw new Error('Chat service not connected. Please wait a moment or refresh the page.');
      }
      
      // ALWAYS use ACS directly for real-time messaging
      // Messages are delivered in real-time via ACS events
      const messageId = await acsSendMessage(newMessage.trim());
      
      if (!messageId) {
        throw new Error('Failed to send message - no message ID returned');
      }
      
      console.log('Message sent successfully:', messageId);
      setNewMessage('');
      onMessageSent?.();
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error to user
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      alert(errorMessage);
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
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1">{thread.otherUser?.displayName}</Typography>
          <Typography variant="caption" color="text.secondary">
            {thread.otherUser?.isOnline ? 'Online' : 'Offline'}
          </Typography>
        </Box>
        {/* ACS Connection Status Indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {acsConnecting ? (
            <>
              <CircularProgress size={12} />
              <Typography variant="caption" color="info.main">
                Connecting...
              </Typography>
            </>
          ) : !acsConnected ? (
            <>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'error.main',
                }}
              />
              <Typography variant="caption" color="error.main" title={acsError || 'Connection failed'}>
                Disconnected
              </Typography>
            </>
          ) : (
            <>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                }}
              />
              <Typography variant="caption" color="success.main">
                Connected
              </Typography>
            </>
          )}
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
