import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import type { AccountInfo } from '@azure/msal-browser';
import { apiService } from '../services/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  account: AccountInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { instance, accounts } = useMsal();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const account = accounts[0] || null;
  const isAuthenticated = !!account;

  // Set up token getter for API service
  useEffect(() => {
    const getAccessToken = async (): Promise<string | null> => {
      if (!account) return null;
      
      try {
        const response = await instance.acquireTokenSilent({
          scopes: ['openid', 'profile', 'email'],
          account: account,
        });
        return response.idToken;
      } catch (error) {
        console.error('Error acquiring token:', error);
        try {
          // If silent token acquisition fails, try interactive
          const response = await instance.acquireTokenPopup({
            scopes: ['openid', 'profile', 'email'],
            account: account,
          });
          return response.idToken;
        } catch (popupError) {
          console.error('Error acquiring token via popup:', popupError);
          return null;
        }
      }
    };

    apiService.setTokenGetter(getAccessToken);
  }, [account, instance]);

  useEffect(() => {
    if (isAuthenticated && account) {
      initializeUser();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, account]);

  const initializeUser = async () => {
    if (!account) return;

    try {
      setIsLoading(true);
      
      // Try to get existing user by Entra ID
      try {
        const existingUser = await apiService.getUserByEntraId(account.localAccountId);
        setUser(existingUser);
        
        // Update online status
        await apiService.updateOnlineStatus(existingUser.id, true);
      } catch (error: any) {
        console.log('User not found or error fetching user:', error.response?.status);
        
        // Only try to create user if it's a 404 (not found)
        if (error.response?.status === 404) {
          const newUser = await apiService.createUser({
            entraIdObjectId: account.localAccountId,
            email: account.username,
            displayName: account.name || account.username,
          });
          setUser(newUser);
        } else {
          // For other errors (like 401), don't try to create user
          console.error('Error initializing user:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Fatal error initializing user:', error);
      // Don't set user if there's an error, but don't prevent loading completion
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    try {
      await instance.loginPopup({
        scopes: ['User.Read', 'openid', 'profile', 'email'],
      });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (user) {
        await apiService.updateOnlineStatus(user.id, false);
      }
      await instance.logoutPopup();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const refreshUser = async () => {
    if (user) {
      const updatedUser = await apiService.getUser(user.id);
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        account,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
