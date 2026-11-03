import { User } from '../types';
import { generateId, getCurrentDate } from '../utils/helpers';

const AUTH_STORAGE_KEY = 'expenses_auth_user';
const AUTH_PROVIDER_KEY = 'expenses_auth_provider';
const GOOGLE_TOKEN_KEY = 'expenses_auth_google_token';

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
   * Store a Google ID token (production login) and the user it describes.
   * The token is only decoded here for display; the server verifies it on every API call.
   */
  static setGoogleSession(idToken: string): User | null {
    try {
      const payload = JSON.parse(
        new TextDecoder().decode(
          Uint8Array.from(atob(idToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))
        )
      );
      if (!payload.email || !payload.exp) return null;

      const user = this.setGoogleUser({
        id: payload.sub,
        email: payload.email,
        name: payload.name || payload.email,
        photoUrl: payload.picture,
      });
      localStorage.setItem(GOOGLE_TOKEN_KEY, JSON.stringify({ idToken, exp: payload.exp }));
      return user;
    } catch (error) {
      console.error('Error reading Google token:', error);
      return null;
    }
  }

  /**
   * Get the Google ID token if it is still valid (1 minute safety margin)
   */
  static getIdToken(): string | null {
    try {
      const stored = localStorage.getItem(GOOGLE_TOKEN_KEY);
      if (!stored) return null;
      const { idToken, exp } = JSON.parse(stored);
      if (!idToken || typeof exp !== 'number') return null;
      return Date.now() / 1000 < exp - 60 ? idToken : null;
    } catch {
      return null;
    }
  }

  /**
   * Logout (clear user)
   */
  static logout(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_PROVIDER_KEY);
    localStorage.removeItem(GOOGLE_TOKEN_KEY);
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
