import {
  CreditCard,
  Investment,
  InvestmentMonthly,
  CarSavings,
  DollarRate,
  Service,
  Debt,
  DebtMonthly,
  DebtSubpayment,
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
  creditCardsMonthly: any[];
  investments: Investment[];
  investmentsMonthly: InvestmentMonthly[];
  carSavings: CarSavings[];
  dollarRates: DollarRate[];
  services: Service[];
  debts: Debt[];
  debtsMonthly: DebtMonthly[];
  debtSubpayments: DebtSubpayment[];
  expenses: Expense[];
  config: AppConfig;
}

const DEFAULT_CONFIG: AppConfig = {
  tabs: [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', route: '/', order: 0 },
    { id: 'creditCards', label: 'Credit Cards', icon: '💳', route: '/credit-cards', order: 1 },
    { id: 'investments', label: 'Investments', icon: '📈', route: '/investments', order: 2 },
    { id: 'dollarRates', label: 'Dollar Rates', icon: '💵', route: '/dollar-rates', order: 3 },
    { id: 'services', label: 'Services', icon: '🧾', route: '/services', order: 4 },
    { id: 'debts', label: 'Debts', icon: '📝', route: '/debts', order: 5 },
    { id: 'expenses', label: 'Expenses', icon: '💰', route: '/expenses', order: 6 },
    { id: 'reports', label: 'Reports', icon: '📋', route: '/reports', order: 7 },
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
      debtsMonthly: [],
      debtSubpayments: [],
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
    const activeInvestments = data.investments.filter((inv) => inv.isActive);
    
    // Auto-generate missing monthly entries
    for (const investment of activeInvestments) {
      await this.ensureInvestmentMonthly(investment, month);
    }
    
    // Reload data after potential auto-generation
    const updatedData = await this.loadAllData();
    const monthlyData = updatedData.investmentsMonthly.filter((im) => im.month === month);
    
    return monthlyData.map((monthly) => {
      const investment = updatedData.investments.find((inv) => inv.id === monthly.investmentId);
      return { ...investment, ...monthly };
    });
  }

  /**
   * Calculate payment number for a given month
   */
  public static calculatePaymentNumber(startMonth: string, targetMonth: string): number {
    const [startYear, startMonthNum] = startMonth.split('-').map(Number);
    const [targetYear, targetMonthNum] = targetMonth.split('-').map(Number);
    
    const startDate = new Date(startYear, startMonthNum - 1);
    const targetDate = new Date(targetYear, targetMonthNum - 1);
    
    const monthsDiff = (targetDate.getFullYear() - startDate.getFullYear()) * 12 +
                       (targetDate.getMonth() - startDate.getMonth());
    
    return monthsDiff + 1; // Payment 1 starts in startMonth
  }

  /**
   * Ensure investment monthly entry exists for a given month (smart auto-generation)
   * Copies amount from previous month if it exists
   */
  private static async ensureInvestmentMonthly(investment: Investment, month: string): Promise<void> {
    const data = await this.loadAllData();
    
    // Check if entry already exists
    const exists = data.investmentsMonthly.find(
      (im) => im.investmentId === investment.id && im.month === month
    );
    
    if (exists) return; // Already exists
    
    // Calculate payment number
    const paymentNumber = this.calculatePaymentNumber(investment.startMonth, month);
    
    // Check if payment number is within total payments
    if (paymentNumber > investment.totalPayments) return; // Beyond last payment
    
    // Get previous month's amount (if exists), otherwise 0
    const previousMonth = this.getPreviousMonth(month);
    const previousMonthly = data.investmentsMonthly.find(
      (im) => im.investmentId === investment.id && im.month === previousMonth
    );
    const amountToCopy = previousMonthly?.amountPerPayment || 0;
    
    // Auto-generate the monthly entry
    const newMonthly: InvestmentMonthly = {
      id: `${investment.id}_${month}`,
      investmentId: investment.id,
      month: month,
      currentPaymentNumber: paymentNumber,
      amountPerPayment: amountToCopy,
      isPaid: false,
      createdAt: this.getCurrentDate(),
      updatedAt: this.getCurrentDate(),
    };
    
    data.investmentsMonthly.push(newMonthly);
    await this.saveAllData(data);
  }

  /**
   * Get previous month in YYYY-MM format
   */
  public static getPreviousMonth(month: string): string {
    const [year, monthNum] = month.split('-').map(Number);
    let newMonth = monthNum - 1;
    let newYear = year;

    if (newMonth === 0) {
      newMonth = 12;
      newYear--;
    }

    return `${newYear}-${String(newMonth).padStart(2, '0')}`;
  }

  /**
   * Get current date (helper)
   */
  private static getCurrentDate(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  /**
   * Export data to JSON file (download)
   */
  public static async exportToJSON(): Promise<void> {
    try {
      const data = await this.loadAllData();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `expenses_2026_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      throw error;
    }
  }

  /**
   * Import data from JSON file
   */
  public static async importFromJSON(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          
          // Validate structure
          if (!jsonData.creditCards || !jsonData.investments || !jsonData.debts) {
            console.error('Invalid data structure');
            resolve(false);
            return;
          }

          // Auto-backup before import
          await this.createAutoBackup();

          // Save imported data
          await this.saveAllData(jsonData);
          resolve(true);
        } catch (error) {
          console.error('Error importing JSON:', error);
          resolve(false);
        }
      };
      reader.readAsText(file);
    });
  }

  /**
   * Create timestamped auto-backup in localStorage (keep last 5)
   */
  public static async createAutoBackup(): Promise<void> {
    try {
      const data = await this.loadAllData();
      const timestamp = new Date().toISOString();
      const backupKey = `${STORAGE_KEY_PREFIX}backup_${timestamp}`;
      
      localStorage.setItem(backupKey, JSON.stringify(data));

      // Cleanup old backups (keep last 5)
      const allKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(`${STORAGE_KEY_PREFIX}backup_`)) {
          allKeys.push(key);
        }
      }

      // Sort and keep only last 5
      if (allKeys.length > 5) {
        allKeys.sort().slice(0, -5).forEach(key => localStorage.removeItem(key!));
      }
    } catch (error) {
      console.error('Error creating auto-backup:', error);
    }
  }

  /**
   * List all available backups
   */
  public static getBackupsList(): Array<{ timestamp: string; size: number; key: string }> {
    const backups: Array<{ timestamp: string; size: number; key: string }> = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${STORAGE_KEY_PREFIX}backup_`)) {
        const timestamp = key.replace(`${STORAGE_KEY_PREFIX}backup_`, '');
        const data = localStorage.getItem(key);
        const size = data ? data.length : 0;
        backups.push({ timestamp, size, key });
      }
    }

    return backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  /**
   * Restore from a specific backup
   */
  public static async restoreFromBackup(backupKey: string): Promise<boolean> {
    try {
      const backupData = localStorage.getItem(backupKey);
      if (!backupData) {
        console.error('Backup not found');
        return false;
      }

      const data = JSON.parse(backupData);
      await this.saveAllData(data);
      return true;
    } catch (error) {
      console.error('Error restoring backup:', error);
      return false;
    }
  }

  /**
   * Get latest backup
   */
  public static async getLatestBackup(): Promise<StorageData | null> {
    const backups = this.getBackupsList();
    if (backups.length === 0) return null;

    const latestBackup = localStorage.getItem(backups[0].key);
    return latestBackup ? JSON.parse(latestBackup) : null;
  }

  /**
   * Delete old backups (keep only N most recent)
   */
  public static deleteOldBackups(keepCount: number = 5): void {
    const backups = this.getBackupsList();
    if (backups.length > keepCount) {
      backups.slice(keepCount).forEach(backup => {
        localStorage.removeItem(backup.key);
      });
    }
  }
}

export default DataService;
