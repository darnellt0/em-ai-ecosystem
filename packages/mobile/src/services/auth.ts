// Authentication Service
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import api from './api';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

class AuthService {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      const response = await api.login(email, password);
      const { user, token } = response;

      // Store credentials
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));

      return { user, token };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async signup(name: string, email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      const response = await api.signup(name, email, password);
      const { user, token } = response;

      // Store credentials
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));

      return { user, token };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      await api.logout();
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local storage
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(USER_DATA_KEY);
    }
  }

  async getStoredToken(): Promise<string | null> {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  }

  async getStoredUser(): Promise<User | null> {
    const userData = await AsyncStorage.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  async refreshToken(): Promise<string> {
    try {
      const response = await api.refreshToken();
      const { token } = response;
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      return token;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getStoredToken();
    return !!token;
  }

  async updateStoredUser(user: User): Promise<void> {
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
  }

  private handleAuthError(error: any): Error {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.message;

      switch (status) {
        case 401:
          return new Error('Invalid credentials');
        case 403:
          return new Error('Access forbidden');
        case 409:
          return new Error('User already exists');
        case 429:
          return new Error('Too many attempts. Please try again later.');
        default:
          return new Error(message || 'Authentication failed');
      }
    }

    if (error.request) {
      return new Error('Network error. Please check your connection.');
    }

    return new Error(error.message || 'An unexpected error occurred');
  }
}

export default new AuthService();
