// Auth Context Provider
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { AuthState, User } from '../types';
import authService from '../services/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Check for stored auth on mount
  useEffect(() => {
    checkStoredAuth();
  }, []);

  const checkStoredAuth = async () => {
    console.log('[AuthContext] Starting checkStoredAuth...');
    try {
      // Add a timeout to ensure we don't hang indefinitely
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => {
          console.log('[AuthContext] Auth check timeout - proceeding without stored auth');
          reject(new Error('Auth check timeout'));
        }, 5000)
      );

      const authPromise = (async () => {
        console.log('[AuthContext] Checking stored token and user...');
        const token = await authService.getStoredToken();
        const user = await authService.getStoredUser();
        console.log('[AuthContext] Token:', !!token, 'User:', !!user);

        if (token && user) {
          console.log('[AuthContext] Found stored auth, setting as authenticated');
          setState({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          console.log('[AuthContext] No stored auth, showing login screen');
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      })();

      await Promise.race([authPromise, timeoutPromise]);
    } catch (error: any) {
      console.error('[AuthContext] Error checking stored auth:', error.message);
      // Always set isLoading to false, even on error
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { user, token } = await authService.login(email, password);

      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Login failed',
      }));
      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { user, token } = await authService.signup(name, email, password);

      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Signup failed',
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = (user: User) => {
    setState((prev) => ({ ...prev, user }));
    authService.updateStoredUser(user);
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        signup,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
