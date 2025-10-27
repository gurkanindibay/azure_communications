import { ChatClient } from '@azure/communication-chat';
import type { ChatMessageReceivedEvent } from '@azure/communication-chat';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';

export interface AcsChatEventHandlers {
  onMessageReceived?: (message: ChatMessageReceivedEvent) => void;
  onTypingIndicatorReceived?: (event: any) => void;
  onReadReceiptReceived?: (event: any) => void;
  onChatMessageEdited?: (event: any) => void;
  onChatMessageDeleted?: (event: any) => void;
  onParticipantsAdded?: (event: any) => void;
  onParticipantsRemoved?: (event: any) => void;
}

export class AcsChatService {
  private chatClient: ChatClient | null = null;
  private currentThreadId: string | null = null;
  private eventHandlers: AcsChatEventHandlers = {};

  async initialize(
    token: string,
    endpoint: string,
    eventHandlers?: AcsChatEventHandlers
  ): Promise<void> {
    try {
      console.log('Initializing ACS chat service...', {
        hasToken: !!token,
        endpoint,
        hasEventHandlers: !!eventHandlers
      });
      
      const tokenCredential = new AzureCommunicationTokenCredential(token);
      this.chatClient = new ChatClient(endpoint, tokenCredential);

      if (eventHandlers) {
        this.eventHandlers = eventHandlers;
        this.setupEventHandlers();
      }

      // Start real-time notifications
      await this.chatClient.startRealtimeNotifications();
      console.log('ACS chat service initialized successfully, real-time notifications started');
    } catch (error) {
      console.error('Failed to initialize ACS chat client:', error);
      throw error;
    }
  }

  private setupEventHandlers(): void {
    if (!this.chatClient) return;

    this.chatClient.on('chatMessageReceived', (event) => {
      this.eventHandlers.onMessageReceived?.(event);
    });

    this.chatClient.on('typingIndicatorReceived', (event) => {
      this.eventHandlers.onTypingIndicatorReceived?.(event);
    });

    this.chatClient.on('readReceiptReceived', (event) => {
      this.eventHandlers.onReadReceiptReceived?.(event);
    });

    this.chatClient.on('chatMessageEdited', (event) => {
      this.eventHandlers.onChatMessageEdited?.(event);
    });

    this.chatClient.on('chatMessageDeleted', (event) => {
      this.eventHandlers.onChatMessageDeleted?.(event);
    });

    this.chatClient.on('participantsAdded', (event) => {
      this.eventHandlers.onParticipantsAdded?.(event);
    });

    this.chatClient.on('participantsRemoved', (event) => {
      this.eventHandlers.onParticipantsRemoved?.(event);
    });
  }

  async joinThread(threadId: string): Promise<void> {
    if (!this.chatClient) throw new Error('Chat client not initialized');

    this.currentThreadId = threadId;
    // ACS handles thread membership automatically when sending messages
  }

  async sendMessage(content: string): Promise<string> {
    if (!this.chatClient || !this.currentThreadId) {
      throw new Error('Chat client not initialized or no active thread');
    }

    const chatThreadClient = this.chatClient.getChatThreadClient(this.currentThreadId);
    const result = await chatThreadClient.sendMessage({ content });
    return result.id;
  }

  async sendTypingIndicator(): Promise<void> {
    if (!this.chatClient || !this.currentThreadId) return;

    const chatThreadClient = this.chatClient.getChatThreadClient(this.currentThreadId);
    await chatThreadClient.sendTypingNotification();
  }

  async sendReadReceipt(messageId: string): Promise<void> {
    if (!this.chatClient || !this.currentThreadId) return;

    const chatThreadClient = this.chatClient.getChatThreadClient(this.currentThreadId);
    await chatThreadClient.sendReadReceipt({ chatMessageId: messageId });
  }

  async editMessage(messageId: string, content: string): Promise<void> {
    if (!this.chatClient || !this.currentThreadId) return;

    const chatThreadClient = this.chatClient.getChatThreadClient(this.currentThreadId);
    await chatThreadClient.updateMessage(messageId, { content });
  }

  async deleteMessage(messageId: string): Promise<void> {
    if (!this.chatClient || !this.currentThreadId) return;

    const chatThreadClient = this.chatClient.getChatThreadClient(this.currentThreadId);
    await chatThreadClient.deleteMessage(messageId);
  }

  async getThreadMessages(options?: {
    maxPageSize?: number;
    startTime?: Date;
  }): Promise<any[]> {
    if (!this.chatClient || !this.currentThreadId) return [];

    const chatThreadClient = this.chatClient.getChatThreadClient(this.currentThreadId);
    const messages = chatThreadClient.listMessages(options);

    const result: any[] = [];
    for await (const message of messages) {
      result.push(message);
    }

    return result;
  }

  dispose(): void {
    if (this.chatClient) {
      this.chatClient.stopRealtimeNotifications();
      this.chatClient = null;
    }
    this.currentThreadId = null;
    this.eventHandlers = {};
  }
}

export const acsChatService = new AcsChatService();