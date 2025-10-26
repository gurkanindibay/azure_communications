import axios, { type AxiosInstance, AxiosError } from 'axios';
import type { 
  User, 
  CreateUserDto, 
  UpdateUserDto, 
  ChatThread, 
  ChatThreadDetail, 
  Message, 
  SendMessageDto,
  PaginationParams 
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5071/api';

// Type for token getter function
type TokenGetter = () => Promise<string | null>;

class ApiService {
  private client: AxiosInstance;
  private getAccessToken: TokenGetter | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for adding auth token
    this.client.interceptors.request.use(
      async (config) => {
        try {
          if (this.getAccessToken) {
            const token = await this.getAccessToken();
            if (token) {
              config.headers.Authorization = `Bearer ${token}`;
            }
          }
        } catch (error) {
          console.error('Error getting access token:', error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          console.error('Unauthorized request - token may be invalid or expired');
        }
        return Promise.reject(error);
      }
    );
  }

  // Method to set the token getter function
  setTokenGetter(getter: TokenGetter) {
    this.getAccessToken = getter;
  }

  // User endpoints
  async getUser(userId: string): Promise<User> {
    const response = await this.client.get<User>(`/users/${userId}`);
    return response.data;
  }

  async getUserByEmail(email: string): Promise<User> {
    const response = await this.client.get<User>(`/users/email/${encodeURIComponent(email)}`);
    return response.data;
  }

  async getUserByEntraId(entraId: string): Promise<User> {
    const response = await this.client.get<User>(`/users/entraid/${entraId}`);
    return response.data;
  }

  async createUser(user: CreateUserDto): Promise<User> {
    const response = await this.client.post<User>('/users', user);
    return response.data;
  }

  async updateUser(userId: string, user: UpdateUserDto): Promise<User> {
    const response = await this.client.put<User>(`/users/${userId}`, user);
    return response.data;
  }

  async searchUsers(query: string): Promise<User[]> {
    const response = await this.client.get<User[]>('/users/search', {
      params: { query },
    });
    return response.data;
  }

  async getOnlineUsers(): Promise<User[]> {
    const response = await this.client.get<User[]>('/users/online');
    return response.data;
  }

  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    await this.client.patch(`/users/${userId}/status`, { isOnline });
  }

  // Chat endpoints
  async getUserThreads(userId: string): Promise<ChatThread[]> {
    const response = await this.client.get<ChatThread[]>(`/chats/user/${userId}`);
    return response.data;
  }

  async getOrCreateThread(currentUserId: string, otherUserId: string): Promise<ChatThread> {
    const response = await this.client.post<ChatThread>('/chats/thread', {
      currentUserId,
      otherUserId,
    });
    return response.data;
  }

  async getThreadDetails(
    threadId: string, 
    currentUserId: string, 
    params?: PaginationParams
  ): Promise<ChatThreadDetail> {
    const response = await this.client.get<ChatThreadDetail>(`/chats/thread/${threadId}`, {
      params: {
        currentUserId,
        pageSize: params?.pageSize || 50,
        pageNumber: params?.pageNumber || 1,
      },
    });
    return response.data;
  }

  async getThreadMessages(
    threadId: string, 
    params?: PaginationParams
  ): Promise<Message[]> {
    const response = await this.client.get<Message[]>(`/chats/thread/${threadId}/messages`, {
      params: {
        pageSize: params?.pageSize || 50,
        pageNumber: params?.pageNumber || 1,
      },
    });
    return response.data;
  }

  async sendMessage(userId: string, message: SendMessageDto): Promise<Message> {
    const response = await this.client.post<Message>('/chats/messages', {
      userId,
      message,
    });
    return response.data;
  }

  async markMessagesAsRead(threadId: string, userId: string): Promise<void> {
    await this.client.post(`/chats/thread/${threadId}/read`, { userId });
  }

  async getUnreadCount(threadId: string, userId: string): Promise<number> {
    const response = await this.client.get<{ unreadCount: number }>(
      `/chats/thread/${threadId}/unread`,
      { params: { userId } }
    );
    return response.data.unreadCount;
  }
}

export const apiService = new ApiService();
