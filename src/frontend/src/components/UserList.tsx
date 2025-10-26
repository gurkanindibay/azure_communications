import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  TextField,
  InputAdornment,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Chip,
  IconButton,
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import type { ChatThread, User } from '../types';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface UserListProps {
  threads: ChatThread[];
  selectedThread: ChatThread | null;
  onThreadSelect: (thread: ChatThread) => void;
  onNewChat: (userId: string) => void;
  loading: boolean;
}

export const UserList: React.FC<UserListProps> = ({
  threads,
  selectedThread,
  onThreadSelect,
  onNewChat,
  loading,
}) => {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const results = await apiService.searchUsers(query);
      // Filter out current user
      setSearchResults(results.filter(u => u.id !== currentUser?.id));
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleUserSelect = (user: User) => {
    onNewChat(user.id);
    setSearchDialogOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const filteredThreads = threads.filter((thread) =>
    thread.otherUser?.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <IconButton
            color="primary"
            onClick={() => setSearchDialogOpen(true)}
            sx={{ flexShrink: 0 }}
          >
            <AddIcon />
          </IconButton>
        </Box>
        <Typography variant="subtitle2" color="text.secondary">
          Chats
        </Typography>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredThreads.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No conversations yet. Click + to start a new chat.
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {filteredThreads.map((thread) => (
              <ListItem key={thread.id} disablePadding>
                <ListItemButton
                  selected={selectedThread?.id === thread.id}
                  onClick={() => onThreadSelect(thread)}
                >
                  <ListItemAvatar>
                    <Badge
                      color="success"
                      variant="dot"
                      invisible={!thread.otherUser?.isOnline}
                    >
                      <Avatar
                        alt={thread.otherUser?.displayName}
                        src={thread.otherUser?.avatarUrl}
                      >
                        {thread.otherUser?.displayName.charAt(0).toUpperCase()}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={thread.otherUser?.displayName}
                    primaryTypographyProps={{
                      variant: 'subtitle2',
                    }}
                    secondary={
                      <>
                        {thread.lastMessage?.content || 'No messages yet'}
                        {thread.lastMessageAt && (
                          <>
                            {' • '}
                            {formatDistanceToNow(new Date(thread.lastMessageAt), {
                              addSuffix: true,
                            })}
                          </>
                        )}
                      </>
                    }
                    secondaryTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary',
                      noWrap: true,
                      sx: { maxWidth: '200px' },
                    }}
                  />
                  {thread.unreadCount && thread.unreadCount > 0 && (
                    <Chip
                      label={thread.unreadCount}
                      size="small"
                      color="primary"
                      sx={{ height: 20, minWidth: 20, ml: 1 }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* Search Users Dialog */}
      <Dialog
        open={searchDialogOpen}
        onClose={() => {
          setSearchDialogOpen(false);
          setSearchQuery('');
          setSearchResults([]);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Start New Chat</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size="small"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          {searching ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {searchResults.map((user) => (
                <ListItem key={user.id} disablePadding>
                  <ListItemButton onClick={() => handleUserSelect(user)}>
                    <ListItemAvatar>
                      <Badge
                        color="success"
                        variant="dot"
                        invisible={!user.isOnline}
                      >
                        <Avatar alt={user.displayName} src={user.avatarUrl}>
                          {user.displayName.charAt(0).toUpperCase()}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={user.displayName}
                      secondary={user.email}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};
