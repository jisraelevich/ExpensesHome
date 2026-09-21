import { User } from '../types';
import { generateId, getCurrentDate } from '../utils/helpers';

const AUTH_STORAGE_KEY = 'expenses_auth_user';
const AUTH_PROVIDER_KEY = 'expenses_auth_provider';

export class AuthService {
  /**
   * Get currently logged-in user from localStorage
   */
  static getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Create or update user (for local testing)
   */
  static setLocalUser(name: string, email: string): User {
    const existingUser = this.getCurrentUser();
    
    const user: User = {
      id: existingUser?.id || generateId(),
      email,
      name,
      provider: 'local',
      createdAt: existingUser?.createdAt || getCurrentDate(),
      updatedAt: getCurrentDate(),
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_PROVIDER_KEY, 'local');
    
    return user;
  }

  /**
   * Set user from Google OAuth (to be implemented)
   */
  static setGoogleUser(user: Omit<User, 'createdAt' | 'updatedAt' | 'provider'>): User {
    const existingUser = this.getCurrentUser();
    
    const newUser: User = {
      ...user,
      provider: 'google',
      createdAt: existingUser?.createdAt || getCurrentDate(),
      updatedAt: getCurrentDate(),
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    localStorage.setItem(AUTH_PROVIDER_KEY, 'google');
    
    return newUser;
  }

  /**
   * Logout (clear user)
   */
  static logout(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_PROVIDER_KEY);
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  /**
   * Get current auth provider
   */
  static getProvider(): 'google' | 'email' | 'local' | null {
    return (localStorage.getItem(AUTH_PROVIDER_KEY) as any) || null;
  }
}
