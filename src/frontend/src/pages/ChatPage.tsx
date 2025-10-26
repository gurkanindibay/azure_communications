import React, { useState, useEffect } from 'react';
import { Box, Paper } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import type { ChatThread } from '../types';
import { UserList } from '../components/UserList.tsx';
import { ChatWindow } from '../components/ChatWindow.tsx';
import { ChatHeader } from '../components/ChatHeader.tsx';

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadThreads();
    }
  }, [user]);

  const loadThreads = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userThreads = await apiService.getUserThreads(user.id);
      setThreads(userThreads);
    } catch (error) {
      console.error('Error loading threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleThreadSelect = (thread: ChatThread) => {
    setSelectedThread(thread);
  };

  const handleNewChat = async (otherUserId: string) => {
    if (!user) return;

    try {
      const thread = await apiService.getOrCreateThread(user.id, otherUserId);
      setThreads((prev) => {
        const exists = prev.find((t) => t.id === thread.id);
        if (exists) return prev;
        return [thread, ...prev];
      });
      setSelectedThread(thread);
    } catch (error) {
      console.error('Error creating thread:', error);
    }
  };

  const refreshThreads = () => {
    loadThreads();
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ChatHeader />
      <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex' }}>
        <Box sx={{ width: { xs: '100%', md: '33.33%', lg: '25%' }, borderRight: 1, borderColor: 'divider', height: '100%' }}>
          <Paper elevation={0} sx={{ height: '100%', borderRadius: 0 }}>
            <UserList
              threads={threads}
              selectedThread={selectedThread}
              onThreadSelect={handleThreadSelect}
              onNewChat={handleNewChat}
              loading={loading}
            />
          </Paper>
        </Box>
        <Box sx={{ flexGrow: 1, height: '100%' }}>
          <ChatWindow
            thread={selectedThread}
            onMessageSent={refreshThreads}
          />
        </Box>
      </Box>
    </Box>
  );
};
