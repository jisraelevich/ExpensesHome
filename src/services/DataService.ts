import {
  CreditCard,
  Investment,
  CarSavings,
  DollarRate,
  Service,
  Debt,
  Expense,
  AppConfig,
} from '../types';

/**
 * DataService - Manages all JSON operations
 * Mimics localStorage API but with localStorage + IndexedDB support
 * Ready to scale to backend database
 */

const STORAGE_KEY_PREFIX = 'expenses_2026_';

interface StorageData {
  creditCards: CreditCard[];
  investments: Investment[];
  carSavings: CarSavings[];
  dollarRates: DollarRate[];
  services: Service[];
  debts: Debt[];
  expenses: Expense[];
  config: AppConfig;
}

const DEFAULT_CONFIG: AppConfig = {
  tabs: [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', route: '/', order: 0 },
    { id: 'creditCards', label: 'Credit Cards', icon: '💳', route: '/credit-cards', order: 1 },
    { id: 'investments', label: 'Investments', icon: '📈', route: '/investments', order: 2 },
    { id: 'carSavings', label: 'Car Savings', icon: '🚗', route: '/car-savings', order: 3 },
    { id: 'dollarRates', label: 'Dollar Rates', icon: '💵', route: '/dollar-rates', order: 4 },
    { id: 'services', label: 'Services', icon: '🧾', route: '/services', order: 5 },
    { id: 'debts', label: 'Debts', icon: '📝', route: '/debts', order: 6 },
    { id: 'expenses', label: 'Expenses', icon: '💰', route: '/expenses', order: 7 },
    { id: 'reports', label: 'Reports', icon: '📋', route: '/reports', order: 8 },
  ],
  currency: 'ARS',
  locale: 'en',
  theme: 'light',
};

class DataService {
  /**
   * Load all data from storage
   */
  public static async loadAllData(): Promise<StorageData> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PREFIX + 'all');
      if (stored) {
        let data = JSON.parse(stored);
        
        // Migration: Remove admin tab from config if it exists
        if (data.config?.tabs) {
          data.config.tabs = data.config.tabs.filter((tab: any) => tab.id !== 'admin');
          await this.saveAllData(data);
        }
        
        return data;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }

    return this.getDefaultData();
  }

  /**
   * Load specific table
   */
  public static async loadTable<T>(tableName: keyof StorageData): Promise<T[]> {
    try {
      const data = await this.loadAllData();
      return data[tableName] as T[];
    } catch (error) {
      console.error(`Error loading ${tableName}:`, error);
      return [];
    }
  }

  /**
   * Save entire dataset
   */
  public static async saveAllData(data: StorageData): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'all', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data:', error);
      throw error;
    }
  }

  /**
   * Add item to table
   */
  public static async addToTable<T extends { id: string }>(
    tableName: keyof StorageData,
    item: T
  ): Promise<T> {
    const data = await this.loadAllData();
    const table = data[tableName] as T[];
    table.push(item);
    await this.saveAllData(data);
    return item;
  }

  /**
   * Update item in table
   */
  public static async updateInTable<T extends { id: string }>(
    tableName: keyof StorageData,
    id: string,
    updates: Partial<T>
  ): Promise<T | null> {
    const data = await this.loadAllData();
    const table = data[tableName] as T[];
    const index = table.findIndex((item) => item.id === id);

    if (index === -1) return null;

    table[index] = { ...table[index], ...updates };
    await this.saveAllData(data);
    return table[index];
  }

  /**
   * Delete item from table
   */
  public static async deleteFromTable(tableName: keyof StorageData, id: string): Promise<boolean> {
    const data = await this.loadAllData();
    const table = data[tableName] as any[];
    const index = table.findIndex((item) => item.id === id);

    if (index === -1) return false;

    table.splice(index, 1);
    await this.saveAllData(data);
    return true;
  }

  /**
   * Query by month
   */
  public static async getByMonth<T extends { month: string }>(
    tableName: keyof StorageData,
    month: string
  ): Promise<T[]> {
    const table = await this.loadTable<T>(tableName);
    return table.filter((item) => item.month === month);
  }

  /**
   * Export as JSON
   */
  public static async exportToJSON(): Promise<string> {
    const data = await this.loadAllData();
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import from JSON
   */
  public static async importFromJSON(jsonString: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonString) as StorageData;
      await this.saveAllData(data);
      return true;
    } catch (error) {
      console.error('Error importing JSON:', error);
      return false;
    }
  }

  /**
   * Reset to default data
   */
  public static async resetToDefaults(): Promise<void> {
    await this.saveAllData(this.getDefaultData());
  }

  /**
   * Get default/empty data structure
   */
  private static getDefaultData(): StorageData {
    return {
      creditCards: [],
      creditCardsMonthly: [],
      investments: [],
      investmentsMonthly: [],
      carSavings: [],
      dollarRates: [],
      services: [],
      debts: [],
      expenses: [],
      config: DEFAULT_CONFIG,
    };
  }

  /**
   * Get config
   */
  public static async getConfig(): Promise<AppConfig> {
    const data = await this.loadAllData();
    return data.config || DEFAULT_CONFIG;
  }

  /**
   * Update config
   */
  public static async updateConfig(updates: Partial<AppConfig>): Promise<AppConfig> {
    const data = await this.loadAllData();
    data.config = { ...data.config, ...updates };
    await this.saveAllData(data);
    return data.config;
  }

  /**
   * Get credit card with monthly data for a specific month
   */
  public static async getCreditCardWithMonthly(creditCardId: string, month: string) {
    const data = await this.loadAllData();
    const card = data.creditCards.find((cc) => cc.id === creditCardId);
    const monthly = data.creditCardsMonthly.find(
      (ccm) => ccm.creditCardId === creditCardId && ccm.month === month
    );
    return { card, monthly };
  }

  /**
   * Get all credit cards with their monthly data for a month
   */
  public static async getCreditCardsForMonth(month: string) {
    const data = await this.loadAllData();
    const monthlyData = data.creditCardsMonthly.filter((ccm) => ccm.month === month);
    
    return monthlyData.map((monthly) => {
      const card = data.creditCards.find((cc) => cc.id === monthly.creditCardId);
      return { ...card, ...monthly };
    });
  }

  /**
   * Get investment with monthly data for a specific month
   */
  public static async getInvestmentWithMonthly(investmentId: string, month: string) {
    const data = await this.loadAllData();
    const investment = data.investments.find((inv) => inv.id === investmentId);
    const monthly = data.investmentsMonthly.find(
      (im) => im.investmentId === investmentId && im.month === month
    );
    return { investment, monthly };
  }

  /**
   * Get all investments with their monthly data for a month
   */
  public static async getInvestmentsForMonth(month: string) {
    const data = await this.loadAllData();
    const monthlyData = data.investmentsMonthly.filter((im) => im.month === month);
    
    return monthlyData.map((monthly) => {
      const investment = data.investments.find((inv) => inv.id === monthly.investmentId);
      return { ...investment, ...monthly };
    });
  }
}

export default DataService;
