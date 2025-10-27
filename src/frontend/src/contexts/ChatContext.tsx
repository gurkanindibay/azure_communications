import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { acsChatService } from '../services/acsChatService';
import type { AcsChatEventHandlers } from '../services/acsChatService';
import { useAuth } from './AuthContext';
import type { Message } from '../types';
import { MessageType } from '../types';

interface ChatContextType {
  messages: Message[];
  isConnected: boolean;
  currentThreadId: string | null;
  joinThread: (threadId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  sendTypingIndicator: () => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const { user, acsToken, acsEndpoint } = useAuth();

  // ACS event handlers
  const acsEventHandlers = useMemo<AcsChatEventHandlers>(() => ({
    onMessageReceived: (event) => {
      const newMessage: Message = {
        id: event.id,
        chatThreadId: currentThreadId || '',
        content: event.message,
        senderId: (event.sender as any).id || event.senderDisplayName || 'Unknown',
        sentAt: event.createdOn.toISOString(),
        isDeleted: false,
        type: MessageType.Text
      };
      setMessages(prev => [...prev, newMessage]);
    },
    onTypingIndicatorReceived: (event) => {
      // Handle typing indicators
      console.log('Typing:', event.senderDisplayName);
    },
    onReadReceiptReceived: (event) => {
      // Handle read receipts
      console.log('Read receipt:', event);
    }
  }), [currentThreadId]);

  useEffect(() => {
    const initializeChat = async () => {
      if (user && acsToken && acsEndpoint && user.azureCommunicationUserId) {
        try {
          await acsChatService.initialize(
            acsToken,
            acsEndpoint,
            acsEventHandlers
          );
          setIsConnected(true);
        } catch (error) {
          console.error('Failed to initialize ACS chat:', error);
          setIsConnected(false);
        }
      }
    };

    initializeChat();

    return () => {
      acsChatService.dispose();
      setIsConnected(false);
    };
  }, [user, acsToken, acsEndpoint, acsEventHandlers]);

  const joinThread = async (threadId: string) => {
    try {
      await acsChatService.joinThread(threadId);
      setCurrentThreadId(threadId);

      // Load existing messages
      const threadMessages = await acsChatService.getThreadMessages();
      const formattedMessages: Message[] = threadMessages.map(msg => ({
        id: msg.id,
        chatThreadId: threadId,
        content: msg.content?.message || '',
        senderId: (msg.sender as any)?.id || msg.senderDisplayName || 'Unknown',
        sentAt: msg.createdOn.toISOString(),
        isDeleted: false,
        type: MessageType.Text
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Failed to join thread:', error);
    }
  };

  const sendMessage = async (content: string) => {
    try {
      await acsChatService.sendMessage(content);
      // Message will be received via real-time events
      // Optionally persist via API for additional metadata
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  const sendTypingIndicator = async () => {
    try {
      await acsChatService.sendTypingIndicator();
    } catch (error) {
      console.error('Failed to send typing indicator:', error);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await acsChatService.sendReadReceipt(messageId);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  return (
    <ChatContext.Provider value={{
      messages,
      isConnected,
      currentThreadId,
      joinThread,
      sendMessage,
      sendTypingIndicator,
      markAsRead
    }}>
      {children}
    </ChatContext.Provider>
  );
};