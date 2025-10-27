import { useState, useEffect, useCallback } from 'react';
import { acsChatService } from '../services/acsChatService';
import type { AcsChatEventHandlers } from '../services/acsChatService';
import type { ChatMessageReceivedEvent } from '@azure/communication-chat';

interface UseAcsChatOptions {
  threadId?: string;
  onMessageReceived?: (message: ChatMessageReceivedEvent) => void;
  onTypingIndicatorReceived?: (event: any) => void;
  onReadReceiptReceived?: (event: any) => void;
  onChatMessageEdited?: (event: any) => void;
  onChatMessageDeleted?: (event: any) => void;
  onParticipantsAdded?: (event: any) => void;
  onParticipantsRemoved?: (event: any) => void;
}

export const useAcsChat = ({
  threadId,
  onMessageReceived,
  onTypingIndicatorReceived,
  onReadReceiptReceived,
  onChatMessageEdited,
  onChatMessageDeleted,
  onParticipantsAdded,
  onParticipantsRemoved,
}: UseAcsChatOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeChat = useCallback(async (token: string, endpoint: string) => {
    if (isConnecting || isConnected) {
      console.log('Already connecting or connected, skipping initialization');
      return;
    }

    try {
      console.log('Starting ACS initialization...', { hasToken: !!token, endpoint });
      setIsConnecting(true);
      setError(null);
      
      const eventHandlers: AcsChatEventHandlers = {
        onMessageReceived,
        onTypingIndicatorReceived,
        onReadReceiptReceived,
        onChatMessageEdited,
        onChatMessageDeleted,
        onParticipantsAdded,
        onParticipantsRemoved,
      };
      
      await acsChatService.initialize(token, endpoint, eventHandlers);
      setIsConnected(true);
      console.log('✅ ACS chat initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error initializing ACS chat:', errorMessage, error);
      setError(errorMessage);
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, isConnected, onMessageReceived, onTypingIndicatorReceived, onReadReceiptReceived, 
      onChatMessageEdited, onChatMessageDeleted, onParticipantsAdded, onParticipantsRemoved]);

  const joinThread = useCallback(async (threadId: string) => {
    if (!isConnected) {
      console.warn('Cannot join thread: ACS chat not connected');
      return;
    }

    try {
      await acsChatService.joinThread(threadId);
      console.log('Joined ACS chat thread:', threadId);
    } catch (error) {
      console.error('Error joining ACS chat thread:', error);
    }
  }, [isConnected]);

  const sendMessage = useCallback(async (content: string): Promise<string | null> => {
    if (!isConnected) {
      console.warn('Cannot send message: ACS chat not connected');
      return null;
    }

    try {
      const messageId = await acsChatService.sendMessage(content);
      return messageId;
    } catch (error) {
      console.error('Error sending message via ACS:', error);
      return null;
    }
  }, [isConnected]);

  const sendTypingIndicator = useCallback(async () => {
    if (!isConnected) return;

    try {
      await acsChatService.sendTypingIndicator();
    } catch (error) {
      console.error('Error sending typing indicator via ACS:', error);
    }
  }, [isConnected]);

  const sendReadReceipt = useCallback(async (messageId: string) => {
    if (!isConnected) return;

    try {
      await acsChatService.sendReadReceipt(messageId);
    } catch (error) {
      console.error('Error sending read receipt via ACS:', error);
    }
  }, [isConnected]);

  const editMessage = useCallback(async (messageId: string, content: string) => {
    if (!isConnected) return;

    try {
      await acsChatService.editMessage(messageId, content);
    } catch (error) {
      console.error('Error editing message via ACS:', error);
    }
  }, [isConnected]);

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!isConnected) return;

    try {
      await acsChatService.deleteMessage(messageId);
    } catch (error) {
      console.error('Error deleting message via ACS:', error);
    }
  }, [isConnected]);

  const getThreadMessages = useCallback(async (options?: {
    maxPageSize?: number;
    startTime?: Date;
  }) => {
    if (!isConnected) return [];

    try {
      return await acsChatService.getThreadMessages(options);
    } catch (error) {
      console.error('Error getting thread messages via ACS:', error);
      return [];
    }
  }, [isConnected]);

  const disconnect = useCallback(() => {
    acsChatService.dispose();
    setIsConnected(false);
    console.log('ACS chat disconnected');
  }, []);

  // Auto-join thread when threadId changes
  useEffect(() => {
    if (threadId && isConnected) {
      joinThread(threadId);
    }
  }, [threadId, isConnected, joinThread]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    initializeChat,
    joinThread,
    sendMessage,
    sendTypingIndicator,
    sendReadReceipt,
    editMessage,
    deleteMessage,
    getThreadMessages,
    disconnect,
  };
};