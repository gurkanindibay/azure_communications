// User types
export interface User {
  id: string;
  entraIdObjectId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  azureCommunicationUserId?: string;
  createdAt: string;
  lastSeenAt?: string;
  isOnline: boolean;
}

export interface CreateUserDto {
  entraIdObjectId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  azureCommunicationUserId?: string;
}

export interface UpdateUserDto {
  displayName?: string;
  avatarUrl?: string;
}

// Chat Thread types
export interface ChatThread {
  id: string;
  azureCommunicationThreadId?: string;
  user1Id: string;
  user2Id: string;
  createdAt: string;
  lastMessageAt?: string;
  isActive: boolean;
  otherUser?: User;
  lastMessage?: Message;
  unreadCount?: number;
}

export interface ChatThreadDetail {
  id: string;
  azureCommunicationThreadId?: string;
  user1: User;
  user2: User;
  messages: Message[];
  createdAt: string;
  lastMessageAt?: string;
  isActive: boolean;
}

// Message types
export const MessageType = {
  Text: 0,
  Image: 1,
  File: 2,
  System: 3
} as const;

export type MessageType = typeof MessageType[keyof typeof MessageType];

export interface Message {
  id: string;
  chatThreadId: string;
  senderId: string;
  sender?: User;
  content: string;
  azureCommunicationMessageId?: string;
  sentAt: string;
  editedAt?: string;
  isDeleted: boolean;
  type: MessageType;
  readReceipts?: ReadReceipt[];
}

export interface SendMessageDto {
  chatThreadId: string;
  content: string;
  type?: MessageType;
}

export interface ReadReceipt {
  id: string;
  messageId: string;
  userId: string;
  user?: User;
  readAt: string;
}

// API Response types
export interface ApiError {
  message: string;
  details?: string;
}

export interface PaginationParams {
  pageSize?: number;
  pageNumber?: number;
}
