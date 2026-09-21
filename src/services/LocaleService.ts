/**
 * Locale Service
 * Handles locale-specific formatting for dates, currency, numbers
 * STORAGE: Always English format (YYYY-MM-DD, standard numbers)
 * DISPLAY: Formatted based on locale (es-AR, en-US, etc.)
 */

export type Currency = 'ARS' | 'USD';
export type Locale = 'en-US' | 'es-AR';

interface LocaleConfig {
  locale: string;
  currency: Currency;
  currencySymbol: string;
  dateFormat: string;
  numberFormat: 'dot' | 'comma'; // dot=1,234.56 | comma=1.234,56
}

const LOCALE_CONFIGS: Record<Locale, LocaleConfig> = {
  'en-US': {
    locale: 'en-US',
    currency: 'USD',
    currencySymbol: '$',
    dateFormat: 'MM/DD/YYYY',
    numberFormat: 'dot',
  },
  'es-AR': {
    locale: 'es-AR',
    currency: 'ARS',
    currencySymbol: '$',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'comma',
  },
};

class LocaleService {
  private currentLocale: Locale = 'es-AR'; // Default to Argentina

  /**
   * Set locale
   */
  public setLocale(locale: Locale): void {
    if (LOCALE_CONFIGS[locale]) {
      this.currentLocale = locale;
      localStorage.setItem('appLocale', locale);
    }
  }

  /**
   * Get current locale
   */
  public getLocale(): Locale {
    const stored = localStorage.getItem('appLocale') as Locale | null;
    if (stored) {
      this.currentLocale = stored;
    }
    return this.currentLocale;
  }

  /**
   * Get locale config
   */
  public getConfig(): LocaleConfig {
    return LOCALE_CONFIGS[this.getLocale()];
  }

  /**
   * Format date for display
   * Input: YYYY-MM-DD (English format, always stored this way)
   * Output: Formatted based on locale
   */
  public formatDate(dateString: string): string {
    try {
      const date = new Date(dateString + 'T00:00:00');
      const locale = this.getLocale();

      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date);
    } catch {
      return dateString;
    }
  }

  /**
   * Format date long (e.g., "September 20, 2026")
   */
  public formatDateLong(dateString: string): string {
    try {
      const date = new Date(dateString + 'T00:00:00');
      const locale = this.getLocale();

      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    } catch {
      return dateString;
    }
  }

  /**
   * Format currency
   * Input: number (e.g., 1500.50)
   * Output: Formatted based on locale and currency (e.g., "$1.500,50" for es-AR)
   */
  public formatCurrency(amount: number, currency?: Currency): string {
    const config = this.getConfig();
    const curr = currency || config.currency;

    try {
      return new Intl.NumberFormat(this.getLocale(), {
        style: 'currency',
        currency: curr,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${config.currencySymbol} ${amount.toFixed(2)}`;
    }
  }

  /**
   * Format number (without currency)
   * Input: number (e.g., 1500.50)
   * Output: Formatted based on locale (e.g., "1.500,50" for es-AR)
   */
  public formatNumber(value: number, decimals: number = 2): string {
    try {
      return new Intl.NumberFormat(this.getLocale(), {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);
    } catch {
      return value.toFixed(decimals);
    }
  }

  /**
   * Parse date from display format to storage format (YYYY-MM-DD)
   * Input: User-entered date in locale format
   * Output: YYYY-MM-DD
   */
  public parseDate(dateString: string): string {
    try {
      // Try parsing as ISO format first
      if (dateString.includes('-')) {
        const [year, month, day] = dateString.split('-');
        if (year.length === 4) {
          return dateString; // Already in YYYY-MM-DD format
        }
      }

      // Try parsing based on current locale
      const locale = this.getLocale();
      const date = new Date(dateString);

      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    } catch {
      return dateString;
    }
  }

  /**
   * Parse number from display format to storage format
   * Input: User-entered number in locale format (e.g., "1.500,50" for es-AR)
   * Output: number (1500.50)
   */
  public parseNumber(valueString: string): number {
    try {
      const config = this.getConfig();

      // Remove currency symbol and whitespace
      let cleaned = valueString.replace(/[^\d.,]/g, '').trim();

      if (config.numberFormat === 'comma') {
        // es-AR: "1.500,50" -> 1500.50
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      } else {
        // en-US: "1,500.50" -> 1500.50
        cleaned = cleaned.replace(/,/g, '');
      }

      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    } catch {
      return parseFloat(valueString) || 0;
    }
  }

  /**
   * Get month name in current locale
   */
  public getMonthName(month: string, format: 'long' | 'short' = 'long'): string {
    try {
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1);

      return new Intl.DateTimeFormat(this.getLocale(), {
        month: format === 'long' ? 'long' : 'short',
        year: 'numeric',
      }).format(date);
    } catch {
      return month;
    }
  }

  /**
   * Get day names (for headers)
   */
  public getDayNames(format: 'long' | 'short' = 'short'): string[] {
    const locale = this.getLocale();
    const formatter = new Intl.DateTimeFormat(locale, { weekday: format === 'long' ? 'long' : 'short' });
    const days = [];

    // Get day names for a week starting Sunday
    for (let i = 0; i < 7; i++) {
      const date = new Date(2024, 0, i + 1); // Jan 1, 2024 is a Monday
      days.push(formatter.format(date));
    }

    return days;
  }

  /**
   * Check if currency is Pesos (ARS)
   */
  public isARS(): boolean {
    return this.getConfig().currency === 'ARS';
  }

  /**
   * Check if currency is Dollars (USD)
   */
  public isUSD(): boolean {
    return this.getConfig().currency === 'USD';
  }
}

export default new LocaleService();
