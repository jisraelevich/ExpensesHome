/**
 * Utility functions for common operations
 */

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get current date in YYYY-MM-DD format
 */
export function getCurrentDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
  const now = new Date();
  return now.toISOString().slice(0, 7);
}

/**
 * Format date for display
 */
export function formatDate(dateString: string, format: 'short' | 'long' = 'short'): string {
  try {
    const date = new Date(dateString);
    if (format === 'short') {
      return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateString;
  }
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: 'ARS' | 'USD' = 'ARS'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Get month name
 */
export function getMonthName(month: string): string {
  // month format: 'YYYY-MM'
  const [year, monthNum] = month.split('-');
  const date = new Date(parseInt(year), parseInt(monthNum) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Parse month string
 */
export function parseMonth(month: string): { year: number; month: number } {
  const [year, monthNum] = month.split('-').map(Number);
  return { year, month: monthNum };
}

/**
 * Get previous month
 */
export function getPreviousMonth(month: string): string {
  const { year, month: monthNum } = parseMonth(month);
  let newMonth = monthNum - 1;
  let newYear = year;

  if (newMonth === 0) {
    newMonth = 12;
    newYear--;
  }

  return `${newYear}-${String(newMonth).padStart(2, '0')}`;
}

/**
 * Get next month
 */
export function getNextMonth(month: string): string {
  const { year, month: monthNum } = parseMonth(month);
  let newMonth = monthNum + 1;
  let newYear = year;

  if (newMonth === 13) {
    newMonth = 1;
    newYear++;
  }

  return `${newYear}-${String(newMonth).padStart(2, '0')}`;
}

/**
 * Convert Pesos to Dollars
 */
export function pesosToDollars(pesos: number, rate: number): number {
  return Math.round((pesos / rate) * 100) / 100;
}

/**
 * Convert Dollars to Pesos
 */
export function dollarsToPesos(dollars: number, rate: number): number {
  return Math.round(dollars * rate * 100) / 100;
}

/**
 * Round to 2 decimals
 */
export function round(value: number, decimals: number = 2): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Export data as CSV
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string = 'export.csv'
): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const rows = data.map((item) =>
    headers.map((header) => {
      const value = item[header];
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    })
  );

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadFile(csv, filename, 'text/csv');
}

/**
 * Download file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate numeric input
 */
export function isValidNumber(value: any): boolean {
  return !isNaN(value) && value !== '' && value !== null && value !== undefined;
}

/**
 * Format number with thousands separator for display (e.g., 1000.50 → "1,000.50")
 */
export function formatMoneyInput(value: number | string): string {
  if (!value && value !== 0) return '';
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  if (isNaN(num)) return '';
  
  const parts = num.toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

/**
 * Parse money input (remove thousands separator and convert to number)
 * Supports both dot (.) and comma (,) as decimal separators
 */
export function parseMoneyInput(value: string): number {
  if (!value) return 0;
  // Replace comma with dot for decimal separator (European format support)
  let cleaned = value.replace(',', '.');
  // Remove any remaining commas (thousands separators)
  cleaned = cleaned.replace(/,/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}
