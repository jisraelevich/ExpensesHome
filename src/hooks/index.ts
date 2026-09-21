import { useState, useEffect, useCallback } from 'react';
import DataService from '../services/DataService';
import { AuthService } from '../services/AuthService';
import { StorageData, User } from '../types';

/**
 * Hook for managing all app data
 */
export function useAppData() {
  const [data, setData] = useState<StorageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const allData = await DataService.loadAllData();
        setData(allData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const allData = await DataService.loadAllData();
      setData(allData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading data');
    }
  }, []);

  return { data, loading, error, refreshData };
}

/**
 * Hook for managing a specific table
 */
export function useTable<T extends { id: string }>(tableName: keyof StorageData) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const data = await DataService.loadTable<T>(tableName);
        setItems(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : `Error loading ${tableName}`);
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, [tableName]);

  const addItem = useCallback(
    async (item: T) => {
      try {
        const result = await DataService.addToTable<T>(tableName, item);
        setItems((prev) => [...prev, result]);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error adding item');
        throw err;
      }
    },
    [tableName]
  );

  const updateItem = useCallback(
    async (id: string, updates: Partial<T>) => {
      try {
        const result = await DataService.updateInTable<T>(tableName, id, updates);
        if (result) {
          setItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
          );
        }
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error updating item');
        throw err;
      }
    },
    [tableName]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      try {
        const success = await DataService.deleteFromTable(tableName, id);
        if (success) {
          setItems((prev) => prev.filter((item) => item.id !== id));
        }
        return success;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error deleting item');
        throw err;
      }
    },
    [tableName]
  );

  const refresh = useCallback(async () => {
    try {
      const data = await DataService.loadTable<T>(tableName);
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Error loading ${tableName}`);
    }
  }, [tableName]);

  return {
    items,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    refresh,
  };
}

/**
 * Hook for managing current month
 */
export function useCurrentMonth() {
  const [month, setMonth] = useState<string>('');

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const monthNum = String(now.getMonth() + 1).padStart(2, '0');
    setMonth(`${year}-${monthNum}`);
  }, []);

  return { month, setMonth };
}

/**
 * Hook for formatting currency in UI
 */
export function useCurrency(amount: number, currency: 'ARS' | 'USD' = 'ARS'): string {
  return `${currency === 'USD' ? '$' : '$'} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Hook for authentication
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = useCallback((name: string, email: string) => {
    const newUser = AuthService.setLocalUser(name, email);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    AuthService.logout();
    setUser(null);
  }, []);

  const isAuthenticated = user !== null;

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
  };
}
