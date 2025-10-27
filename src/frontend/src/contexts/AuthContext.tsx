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
  acsToken: string | null;
  acsEndpoint: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshAcsToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { instance, accounts } = useMsal();
  const [user, setUser] = useState<User | null>(null);
  const [acsToken, setAcsToken] = useState<string | null>(null);
  const [acsEndpoint, setAcsEndpoint] = useState<string | null>(null);
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
      
      // Use the new getOrCreateUser endpoint which handles all the logic safely
      const user = await apiService.getOrCreateUser({
        entraIdObjectId: account.localAccountId,
        email: account.username,
        displayName: account.name || account.username,
      });
      
      setUser(user);
      
      // Update online status
      await apiService.updateOnlineStatus(user.id, true);
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

  const refreshAcsToken = async () => {
    if (!user) return;

    try {
      const response = await apiService.getAcsToken();
      setAcsToken(response.token);
      // Extract endpoint from the token or use a configured endpoint
      setAcsEndpoint(import.meta.env.VITE_ACS_ENDPOINT || 'https://your-acs-resource.communication.azure.com/');
    } catch (error) {
      console.error('Failed to get ACS token:', error);
    }
  };

  useEffect(() => {
    if (user) {
      refreshAcsToken();
    }
  }, [user]);

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
        acsToken,
        acsEndpoint,
        login,
        logout,
        refreshUser,
        refreshAcsToken,
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
