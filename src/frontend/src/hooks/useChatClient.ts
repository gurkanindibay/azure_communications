import { useEffect, useState, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import type { Message } from '../types';

interface UseSignalRChatOptions {
  threadId?: string;
  onMessageReceived?: (message: Message) => void;
}

export const useSignalRChat = ({ threadId, onMessageReceived }: UseSignalRChatOptions) => {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  const connectToHub = useCallback(async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5071';
      
      const newConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${apiUrl}/hubs/chat`, {
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Set up event handlers before starting
      newConnection.on('ReceiveMessage', (message: Message) => {
        console.log('Message received via SignalR:', message);
        onMessageReceived?.(message);
      });

      newConnection.onreconnecting((error) => {
        console.log('SignalR reconnecting...', error);
        setIsConnected(false);
      });

      newConnection.onreconnected((connectionId) => {
        console.log('SignalR reconnected:', connectionId);
        setIsConnected(true);
        
        // Rejoin thread group after reconnection
        if (threadId && newConnection.state === signalR.HubConnectionState.Connected) {
          newConnection.invoke('JoinThread', threadId).catch((err) => {
            console.error('Error rejoining thread after reconnect:', err);
          });
        }
      });

      newConnection.onclose((error) => {
        console.log('SignalR connection closed', error);
        setIsConnected(false);
        if (error) {
          setError(error);
        }
      });

      await newConnection.start();
      console.log('SignalR connected successfully');
      
      connectionRef.current = newConnection;
      setConnection(newConnection);
      setIsConnected(true);
      setError(null);

      return newConnection;
    } catch (err) {
      console.error('Error connecting to SignalR hub:', err);
      setError(err as Error);
      setIsConnected(false);
      return null;
    }
  }, [onMessageReceived]);

  // Join thread group when threadId changes
  useEffect(() => {
    if (threadId && connection && connection.state === signalR.HubConnectionState.Connected) {
      console.log('Joining thread group:', threadId);
      connection.invoke('JoinThread', threadId).catch((err) => {
        console.error('Error joining thread:', err);
      });

      return () => {
        console.log('Leaving thread group:', threadId);
        connection.invoke('LeaveThread', threadId).catch((err) => {
          console.error('Error leaving thread:', err);
        });
      };
    }
  }, [threadId, connection]);

  // Initialize connection
  useEffect(() => {
    connectToHub();

    return () => {
      if (connectionRef.current) {
        console.log('Stopping SignalR connection');
        connectionRef.current.stop().catch((err) => {
          console.error('Error stopping SignalR connection:', err);
        });
      }
    };
  }, [connectToHub]);

  const sendTypingNotification = useCallback(async (userId: string) => {
    if (threadId && connection && connection.state === signalR.HubConnectionState.Connected) {
      try {
        await connection.invoke('NotifyTyping', threadId, userId);
      } catch (err) {
        console.error('Error sending typing notification:', err);
      }
    }
  }, [threadId, connection]);

  return {
    connection,
    isConnected,
    error,
    sendTypingNotification,
  };
};

