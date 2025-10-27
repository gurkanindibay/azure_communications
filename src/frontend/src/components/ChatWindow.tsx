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
    console.log('🔥 New message received via ACS:', event);
    console.log('Event details:', {
      messageId: event.id,
      senderId: event.sender?.communicationUserId,
      senderDisplayName: event.senderDisplayName,
      content: event.content?.message,
      threadId: event.threadId,
      currentThreadId: thread?.azureCommunicationThreadId,
      currentUserId: user?.id,
      currentUserAcsId: user?.azureCommunicationUserId
    });
    
    // Convert ACS message to our Message format
    const message: Message = {
      id: event.id,
      chatThreadId: event.threadId,
      senderId: event.sender?.communicationUserId || event.senderDisplayName, // ACS user ID
      content: event.content?.message || '',
      type: MessageType.Text,
      sentAt: event.createdOn || new Date().toISOString(),
      isDeleted: false,
    };
    
    console.log('Converted message:', {
      id: message.id,
      senderId: message.senderId,
      content: message.content,
      threadId: message.chatThreadId
    });
    
    console.log('Checking thread match:', {
      hasThread: !!thread,
      eventThreadId: event.threadId,
      currentThreadId: thread?.azureCommunicationThreadId,
      match: event.threadId === thread?.azureCommunicationThreadId
    });
    
    // Check if this message belongs to the current thread
    // If we don't have a thread loaded yet, but this is our message (sender matches current user), add it anyway
    const isCurrentThread = thread && event.threadId === thread.azureCommunicationThreadId;
    const isOwnMessage = user && (message.senderId === user.azureCommunicationUserId || message.senderId === user.id);
    
    console.log('Message ownership check:', {
      messageSenderId: message.senderId,
      userAcsId: user?.azureCommunicationUserId,
      userDbId: user?.id,
      isOwnMessage
    });
    
    // Accept message if it's for the current thread OR if it's our own message (for optimistic updates)
    if (isCurrentThread || isOwnMessage) {
      setMessages((prev) => {
        // Avoid duplicates by checking if message already exists
        const exists = prev.some((m) => m.id === message.id);
        if (exists) {
          console.log('Message already exists, skipping:', message.id);
          return prev;
        }
        
        console.log('✅ Adding new message to UI:', message);
        
        // Insert message in chronological order (oldest first)
        const newMessages = [...prev, message];
        newMessages.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
        
        return newMessages;
      });
      
      // Mark as read if it's not from the current user (compare ACS user IDs)
      if (user && message.senderId !== user.azureCommunicationUserId) {
        // Debounce mark as read to avoid excessive API calls
        debouncedMarkAsRead(thread?.id || '', user.id);
      }
    } else {
      console.log('❌ Message not added - thread mismatch or no thread', {
        hasThread: !!thread,
        threadAcsId: thread?.azureCommunicationThreadId,
        eventThreadId: event.threadId,
        isOwnMessage,
        isCurrentThread
      });
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
    getThreadMessages,
  } = useAcsChat({
    threadId: thread?.azureCommunicationThreadId,
    onMessageReceived: handleMessageReceived,
  });

  // Initialize ACS connection once when token is available and thread is selected
  useEffect(() => {
    console.log('ChatWindow: ACS initialization check', {
      acsConnected,
      acsConnecting,
      hasAcsToken: !!acsToken,
      hasAcsEndpoint: !!acsEndpoint,
      hasThread: !!thread,
      initAttempted: initAttemptedRef.current
    });
    
    if (!acsConnected && !acsConnecting && acsToken && acsEndpoint && thread && !initAttemptedRef.current) {
      console.log('ChatWindow: Starting ACS initialization...', { 
        hasToken: !!acsToken, 
        tokenLength: acsToken?.length,
        endpoint: acsEndpoint,
        threadId: thread.azureCommunicationThreadId
      });
      initAttemptedRef.current = true; // Mark that we've attempted initialization
      initializeChat(acsToken, acsEndpoint);
    }
  }, [acsToken, acsEndpoint, acsConnected, acsConnecting, thread]); // Include thread in dependencies

  // Load messages when thread changes
  useEffect(() => {
    console.log('Thread changed:', {
      hasThread: !!thread,
      threadId: thread?.id,
      acsThreadId: thread?.azureCommunicationThreadId,
      fullThread: thread
    });
    
    if (thread) {
      // If ACS is already connected, load messages immediately
      if (acsConnected && thread.azureCommunicationThreadId) {
        loadMessages();
      }
      markAsRead();
    } else {
      setMessages([]);
    }
  }, [thread?.id]); // Only depend on thread ID

  // Load messages when ACS connection is established
  useEffect(() => {
    if (thread && acsConnected && thread.azureCommunicationThreadId) {
      console.log('ACS connected, loading messages...');
      // Small delay to ensure thread join completes
      setTimeout(() => loadMessages(), 500);
    }
  }, [acsConnected, thread?.azureCommunicationThreadId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    if (!thread) return;

    console.log('Loading messages for thread:', {
      threadId: thread.id,
      acsThreadId: thread.azureCommunicationThreadId,
      acsConnected,
      thread: thread
    });

    try {
      setLoading(true);

      // Try to load messages directly from ACS first (fastest and most reliable)
      if (acsConnected && thread.azureCommunicationThreadId) {
        console.log('Loading messages from ACS...');
        try {
          const acsMessages = await getThreadMessages();
          
          console.log('Raw ACS messages received:', acsMessages);
          console.log('Loaded messages from ACS:', {
            count: acsMessages.length,
            messages: acsMessages.map((m: any) => ({
              id: m.id,
              senderId: (m.sender as any)?.communicationUserId,
              senderDisplayName: m.senderDisplayName,
              content: m.content?.message,
              sentAt: m.createdOn,
              type: m.type
            }))
          });

          if (acsMessages.length === 0) {
            console.log('No messages from ACS, trying backend fallback...');
            throw new Error('No messages from ACS');
          }

          // Convert ACS messages to our Message format
          const convertedMessages: Message[] = acsMessages.map((acsMsg: any) => {
            const senderId = (acsMsg.sender as any)?.communicationUserId || acsMsg.senderDisplayName || '';
            const message: Message = {
              id: acsMsg.id,
              chatThreadId: thread.azureCommunicationThreadId || '',
              senderId: senderId,
              content: acsMsg.content?.message || '',
              type: MessageType.Text,
              sentAt: acsMsg.createdOn?.toISOString() || new Date().toISOString(),
              isDeleted: acsMsg.deletedOn !== undefined,
            };
            
            console.log('Converted ACS message:', {
              id: message.id,
              senderId: message.senderId,
              rawSender: acsMsg.sender,
              senderDisplayName: acsMsg.senderDisplayName,
              content: message.content?.substring(0, 50)
            });
            
            return message;
          });

          // Sort messages by timestamp (oldest first)
          convertedMessages.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());

          setMessages(convertedMessages);
          return;
        } catch (acsError) {
          console.warn('Failed to load messages from ACS, falling back to backend:', acsError);
        }
      }

      // Fallback to backend API if ACS not available or failed
      console.log('Loading messages from backend API...');
      const threadMessages = await apiService.getThreadMessages(thread.id);
      
      console.log('Loaded messages from API:', {
        count: threadMessages.length,
        messages: threadMessages.map(m => ({
          id: m.id,
          senderId: m.senderId,
          content: m.content,
          sentAt: m.sentAt
        }))
      });
      
      // Sort messages by timestamp (oldest first)
      threadMessages.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
      
      setMessages(threadMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      // Show error to user
      const errorMessage = error instanceof Error ? error.message : 'Failed to load messages';
      console.error('Message loading error:', errorMessage);
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
      
      // Optimistically add the message to UI immediately to avoid race conditions
      const optimisticMessage: Message = {
        id: messageId,
        chatThreadId: thread.azureCommunicationThreadId || '',
        senderId: user?.azureCommunicationUserId || user?.id || '', // Use ACS ID if available, fallback to DB ID
        content: newMessage.trim(),
        type: MessageType.Text,
        sentAt: new Date().toISOString(),
        isDeleted: false,
      };
      
      console.log('Optimistic message:', {
        id: optimisticMessage.id,
        senderId: optimisticMessage.senderId,
        userAcsId: user?.azureCommunicationUserId,
        userDbId: user?.id,
        content: optimisticMessage.content
      });
      
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
            // In a 1-on-1 chat, every message is either from the current user or the other user
            // Compare the message sender ACS ID with the current user's ACS ID
            const isOwnMessage = user?.azureCommunicationUserId && message.senderId === user.azureCommunicationUserId;
            
            console.log('Message ownership check:', {
              messageId: message.id,
              messageSenderId: message.senderId,
              userAcsId: user?.azureCommunicationUserId,
              isOwnMessage,
              messageContent: message.content?.substring(0, 50)
            });
            
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
