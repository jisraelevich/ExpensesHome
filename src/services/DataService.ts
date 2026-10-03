import {
  CreditCard,
  Investment,
  InvestmentMonthly,
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
  dollarRates: DollarRate[];
  services: Service[];
  debts: Debt[];
  debtsMonthly: DebtMonthly[];
  debtSubpayments: DebtSubpayment[];
  expenses: Expense[];
  serviceBases: any[];
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
  private static isSaving = false; // Prevent concurrent saves during startup

  /**
   * Load all data from storage
   */
  public static async loadAllData(): Promise<StorageData> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PREFIX + 'all');
      if (stored) {
        let data = JSON.parse(stored);
        
        // Ensure all required fields exist (for old data compatibility)
        const defaults = this.getDefaultData();
        data = {
          creditCards: data.creditCards ?? defaults.creditCards,
          creditCardsMonthly: data.creditCardsMonthly ?? defaults.creditCardsMonthly,
          investments: data.investments ?? defaults.investments,
          investmentsMonthly: data.investmentsMonthly ?? defaults.investmentsMonthly,
          dollarRates: data.dollarRates ?? defaults.dollarRates,
          services: data.services ?? defaults.services,
          debts: data.debts ?? defaults.debts,
          debtsMonthly: data.debtsMonthly ?? defaults.debtsMonthly,
          debtSubpayments: data.debtSubpayments ?? defaults.debtSubpayments,
          expenses: data.expenses ?? defaults.expenses,
          serviceBases: data.serviceBases ?? defaults.serviceBases,
          config: data.config ?? defaults.config,
        };
        
        // Migration: Remove admin tab from config (only run once)
        const migrationKey = `${STORAGE_KEY_PREFIX}migration_v1_admin_tab_removed`;
        if (!localStorage.getItem(migrationKey) && data.config?.tabs) {
          const hasAdminTab = data.config.tabs.some((tab: any) => tab.id === 'admin');
          if (hasAdminTab) {
            data.config.tabs = data.config.tabs.filter((tab: any) => tab.id !== 'admin');
            // Save without triggering backup (it's just a migration)
            localStorage.setItem(STORAGE_KEY_PREFIX + 'all', JSON.stringify(data));
            localStorage.setItem(migrationKey, 'true');
            console.log('✅ Migration: Removed admin tab from config');
          }
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
      return data[tableName] as T[] || [];
    } catch (error) {
      console.error(`Error loading ${tableName}:`, error);
      return [];
    }
  }

  /**
   * Save entire dataset with safety checks
   * - Validate data integrity
   * - Prevent data loss
   * - NOTE: Automatic backups are DISABLED. Use manual backups only.
   */
  public static async saveAllData(data: StorageData): Promise<void> {
    try {
      // Validate data integrity - prevent catastrophic loss
      const currentData = this.loadAllDataSync();
      this.validateDataIntegrity(currentData, data);

      // Now save the new data
      localStorage.setItem(STORAGE_KEY_PREFIX + 'all', JSON.stringify(data));

      console.log('✅ Data saved successfully');
    } catch (error) {
      console.error('❌ ERROR SAVING DATA:', error);
      throw error;
    }
  }

  /**
   * Synchronous load for backup operations (no error handling to fail fast)
   */
  private static loadAllDataSync(): StorageData {
    const stored = localStorage.getItem(STORAGE_KEY_PREFIX + 'all');
    return stored ? JSON.parse(stored) : this.getDefaultData();
  }

  /**
   * Validate that we're not losing critical data
   */
  private static validateDataIntegrity(currentData: StorageData, newData: StorageData): void {
    const criticalTables: (keyof StorageData)[] = [
      'creditCards',
      'investments',
      'debts',
      'dollarRates',
      'expenses',
    ];

    for (const tableName of criticalTables) {
      const currentCount = (currentData[tableName] as any[])?.length || 0;
      const newCount = (newData[tableName] as any[])?.length || 0;

      // Warn if a table is losing >50% of items (possible bug)
      if (currentCount > 0 && newCount < currentCount * 0.5) {
        const lossPercentage = Math.round((1 - newCount / currentCount) * 100);
        console.warn(
          `⚠️ DATA LOSS WARNING: ${tableName} losing ${lossPercentage}% of items (${currentCount} → ${newCount})`
        );

        // If we're losing ALL items from a critical table, throw error
        if (newCount === 0 && currentCount > 0) {
          throw new Error(
            `CRITICAL: Refusing to save - would erase all ${tableName} (${currentCount} items lost). This is likely a bug. Backup created for recovery.`
          );
        }
      }
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
      dollarRates: [],
      services: [],
      debts: [],
      debtsMonthly: [],
      debtSubpayments: [],
      expenses: [],
      serviceBases: [],
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

          // Save imported data (no automatic backup)
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
   * Get today's date in YYYY-MM-DD format
   */
  private static getTodayDate(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  /**
   * Check if we should create an auto-backup (max once per day)
   * This uses atomic flag setting to prevent race conditions at startup
   */
  private static shouldCreateAutoBackup(): boolean {
    const today = this.getTodayDate();
    const lastBackupDate = localStorage.getItem(`${STORAGE_KEY_PREFIX}last_backup_date`);
    
    console.log(`🔍 Backup check - Today: ${today}, Last backup: ${lastBackupDate}`);
    
    // If backup already done today, skip
    if (lastBackupDate === today) {
      console.log(`⏭️ Backup already created today - SKIPPING`);
      return false;
    }
    
    // Mark backup as in-progress for today (atomic to prevent race conditions)
    // This prevents multiple saves at startup from each creating a backup
    localStorage.setItem(`${STORAGE_KEY_PREFIX}last_backup_date`, today);
    console.log(`✅ Daily flag set, creating backup...`);
    return true;
  }

  /**
   * Create auto-backup only if needed (once per day max)
   */
  public static async createAutoBackupIfNeeded(): Promise<string | null> {
    try {
      // Double-check we should create backup (prevents race conditions)
      if (!this.shouldCreateAutoBackup()) {
        return null;
      }

      const data = await this.loadAllData();
      // Use timestamp with milliseconds + random suffix to ensure uniqueness
      const now = new Date();
      const isoString = now.toISOString();
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      const backupKey = `${STORAGE_KEY_PREFIX}backup_${isoString}_${randomSuffix}`;
      
      // Only backup if we have actual data (not empty default state)
      const hasData = data.creditCards.length > 0 || 
                      data.investments.length > 0 ||
                      data.debts.length > 0 ||
                      data.expenses.length > 0;

      if (hasData) {
        localStorage.setItem(backupKey, JSON.stringify(data));
        this.cleanOldBackups(100);
        console.log(`💾 Auto-backup created (once per day): ${isoString}`);
        return backupKey;
      } else {
        console.log('⏭️ No auto-backup created (no data yet)');
        return null;
      }
    } catch (error) {
      console.error('❌ Error creating auto-backup:', error);
      throw error;
    }
  }

  /**
   * Create on-demand backup (always creates, bypasses daily limit)
   */
  public static async createManualBackup(): Promise<string> {
    try {
      const data = await this.loadAllData();
      const timestamp = new Date().toISOString();
      const backupKey = `${STORAGE_KEY_PREFIX}backup_${timestamp}`;
      
      localStorage.setItem(backupKey, JSON.stringify(data));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}last_backup_date`, this.getTodayDate());
      
      // Keep last 100 backups
      this.cleanOldBackups(100);
      
      console.log(`💾 Manual backup created: ${timestamp}`);
      return backupKey;
    } catch (error) {
      console.error('❌ Error creating manual backup:', error);
      throw error;
    }
  }

  /**
   * Clean old backups, keeping only the most recent N
   */
  private static cleanOldBackups(keepCount: number): void {
    const allKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${STORAGE_KEY_PREFIX}backup_`)) {
        allKeys.push(key);
      }
    }

    if (allKeys.length === 0) return;

    // Group backups by date
    const backupsByDate: { [date: string]: string[] } = {};
    allKeys.forEach((key) => {
      // Extract date from key: "expenses_2026_backup_2026-10-01T19:22:24.123Z_xyz"
      const dateMatch = key.match(/backup_(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        const date = dateMatch[1];
        if (!backupsByDate[date]) {
          backupsByDate[date] = [];
        }
        backupsByDate[date].push(key);
      }
    });

    // For each day, keep only the first (oldest) backup and delete duplicates
    const toDelete: string[] = [];
    Object.values(backupsByDate).forEach((backupsForDay) => {
      if (backupsForDay.length > 1) {
        // Sort chronologically and delete all but the first
        const sorted = backupsForDay.sort();
        const duplicates = sorted.slice(1);
        toDelete.push(...duplicates);
        console.log(`🗑️ Removing ${duplicates.length} duplicate backup(s) from date ${backupsForDay[0].split('backup_')[1]?.substring(0, 10)}`);
      }
    });

    // Also remove old backups if we have more than keepCount total
    const sortedByDate = allKeys.sort();
    if (sortedByDate.length > keepCount) {
      const oldBackups = sortedByDate.slice(0, -keepCount);
      toDelete.push(...oldBackups.filter(key => !toDelete.includes(key)));
    }

    // Delete all marked backups
    const uniqueToDelete = [...new Set(toDelete)];
    uniqueToDelete.forEach((key) => {
      localStorage.removeItem(key);
      console.log(`🗑️ Deleted backup: ${key.substring(0, 60)}...`);
    });

    if (uniqueToDelete.length > 0) {
      console.log(`✅ Cleanup complete: removed ${uniqueToDelete.length} backup(s), kept ${sortedByDate.length - uniqueToDelete.length}`);
    }
  }

  /**
   * Legacy: Create auto-backup (kept for backward compatibility, use createAutoBackupIfNeeded)
   * @deprecated Use createAutoBackupIfNeeded() instead
   */
  public static async createAutoBackup(): Promise<string> {
    const result = await this.createAutoBackupIfNeeded();
    if (result) return result;
    
    // If daily limit reached, still return a valid key for compatibility
    const backups = this.getBackupsList();
    return backups.length > 0 ? backups[0].key : `${STORAGE_KEY_PREFIX}backup_none`;
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

  /**
   * Get latest exchange rate (ARS/USD)
   * Used globally across app for currency conversions
   * TODO: Future - support different rates per month/year
   */
  public static async getLatestExchangeRate(): Promise<DollarRate | null> {
    try {
      const data = await this.loadAllData();
      if (!data.dollarRates || data.dollarRates.length === 0) {
        // Return default rate if none exists
        return {
          id: 'default',
          date: this.getCurrentDate(),
          mepValue: 210.5,
          correctionValue: 0,
          realValue: 210.5,
          source: 'Default Rate',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      // Return the most recent rate (last in array)
      return data.dollarRates[data.dollarRates.length - 1];
    } catch (error) {
      console.error('Error getting exchange rate:', error);
      return null;
    }
  }

  /**
   * Ensure a default exchange rate exists (for initial setup)
   */
  public static async ensureExchangeRate(): Promise<DollarRate> {
    try {
      const data = await this.loadAllData();
      
      // If we have rates, return the latest
      if (data.dollarRates && data.dollarRates.length > 0) {
        return data.dollarRates[data.dollarRates.length - 1];
      }

      // Create default rate
      const defaultRate: DollarRate = {
        id: 'default-' + Date.now(),
        date: this.getCurrentDate(),
        mepValue: 210.5,
        correctionValue: 0,
        realValue: 210.5,
        source: 'Default Rate',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      data.dollarRates.push(defaultRate);
      await this.saveAllData(data);
      return defaultRate;
    } catch (error) {
      console.error('Error ensuring exchange rate:', error);
      throw error;
    }
  }

  /**
   * Check if a debt sub-payment is visible in a given month
   * Visibility rules:
   * - totalPayments = 0: permanent (always visible from startDate onwards)
   * - totalPayments = 1: only visible in the month it starts
   * - totalPayments > 1: visible for that many months from startDate
   */
  public static isSubpaymentVisibleInMonth(subpayment: DebtSubpayment, targetMonth: string): boolean {
    const [startYear, startMonth] = subpayment.startDate.split('-').slice(0, 2).map(Number);
    const [targetYear, targetMonthNum] = targetMonth.split('-').map(Number);

    // Calculate months between start and target
    const monthsDiff = (targetYear - startYear) * 12 + (targetMonthNum - startMonth);

    // If target month is before start date, not visible
    if (monthsDiff < 0) {
      return false;
    }

    // If totalPayments = 0, always visible (permanent)
    if (subpayment.totalPayments === 0) {
      return true;
    }

    // If totalPayments = 1, only visible in the start month
    if (subpayment.totalPayments === 1) {
      return monthsDiff === 0;
    }

    // If totalPayments > 1, visible until that many months have passed
    return monthsDiff < subpayment.totalPayments;
  }

  /**
   * Get visible sub-payments for a debt in a given month
   */
  public static async getVisibleSubpaymentsForMonth(
    debtId: string,
    month: string
  ): Promise<DebtSubpayment[]> {
    try {
      const data = await this.loadAllData();
      const debtSubpayments = data.debtSubpayments.filter((sp: DebtSubpayment) => sp.debtId === debtId && sp.isActive);

      return debtSubpayments.filter((sp: DebtSubpayment) => this.isSubpaymentVisibleInMonth(sp, month));
    } catch (error) {
      console.error('Error getting visible subpayments:', error);
      return [];
    }
  }

  /**
   * Calculate which payment number this is for a subpayment in a given month
   * Returns { current, total } where:
   * - current: which number payment (1, 2, 3, etc.)
   * - total: totalPayments value (0 for permanent, 1 for single month, or the number of months)
   */
  public static getPaymentNumber(subpayment: DebtSubpayment, targetMonth: string): { current: number; total: number } {
    const [startYear, startMonth] = subpayment.startDate.split('-').slice(0, 2).map(Number);
    const [targetYear, targetMonthNum] = targetMonth.split('-').map(Number);

    // Calculate months between start and target
    const monthsDiff = (targetYear - startYear) * 12 + (targetMonthNum - startMonth);

    // Current payment number starts at 1
    const current = monthsDiff + 1;

    return {
      current: Math.max(1, current),
      total: subpayment.totalPayments,
    };
  }

  /**
   * Get data recovery information for display
   */
  public static getRecoveryInfo(): {
    totalBackups: number;
    oldestBackup: string | null;
    newestBackup: string | null;
    canRecover: boolean;
  } {
    const backupKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_KEY_PREFIX + 'backup_')) {
        backupKeys.push(key);
      }
    }

    backupKeys.sort();
    return {
      totalBackups: backupKeys.length,
      oldestBackup: backupKeys.length > 0 ? backupKeys[0] : null,
      newestBackup: backupKeys.length > 0 ? backupKeys[backupKeys.length - 1] : null,
      canRecover: backupKeys.length > 0,
    };
  }

  /**
   * Emergency recovery - restore from most recent backup
   */
  public static async emergencyRecover(): Promise<boolean> {
    try {
      const backups = this.getRecoveryInfo();
      if (!backups.canRecover || !backups.newestBackup) {
        console.error('❌ No backups available for recovery');
        return false;
      }

      const backupData = localStorage.getItem(backups.newestBackup);
      if (!backupData) return false;

      const data = JSON.parse(backupData);
      // Save directly without triggering another backup to avoid infinite loop
      localStorage.setItem(STORAGE_KEY_PREFIX + 'all', JSON.stringify(data));
      
      console.log('✅ Emergency recovery completed from:', backups.newestBackup);
      return true;
    } catch (error) {
      console.error('❌ Emergency recovery failed:', error);
      return false;
    }
  }
}

export default DataService;
