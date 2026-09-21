// ========== CREDIT CARD - BASE ========== 
export interface CreditCard {
  id: string;
  bankName: string;
  cardType: 'visa' | 'mastercard' | 'amex' | 'other';
  isActive: boolean; // Can be hidden/archived
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ========== CREDIT CARD - MONTHLY VARIATION ==========
export interface CreditCardMonthly {
  id: string;
  creditCardId: string; // Link to CreditCard
  month: string; // 'YYYY-MM'
  amountPesos: number;
  amountDollars: number;
  closeDate: number; // Day of month
  dueDate: number; // Day of month
  isPaid: boolean;
  paidDate?: string; // 'YYYY-MM-DD'
  createdAt: string;
  updatedAt: string;
}

// ========== INVESTMENT - BASE ==========
export interface Investment {
  id: string;
  broker: string;
  type: 'insurance' | 'investment' | 'retirement' | 'other';
  year: number;
  isActive: boolean; // Can be hidden/archived
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ========== INVESTMENT - MONTHLY VARIATION ==========
export interface InvestmentMonthly {
  id: string;
  investmentId: string; // Link to Investment
  month: string; // 'YYYY-MM'
  currentPaymentNumber: number;
  totalPayments: number;
  amountPerPayment: number;
  isPaid: boolean;
  paidDate?: string;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

// ========== CAR SAVINGS TABLE ==========
export interface CarSavings {
  id: string;
  month: string; // 'YYYY-MM'
  amountPesos: number;
  amountDollars?: number;
  isPaid: boolean;
  paidDate?: string;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

// ========== DOLLAR RATE TABLE ==========
export interface DollarRate {
  id: string;
  date: string; // 'YYYY-MM-DD'
  mepValue: number; // MEP official rate
  correctionValue: number; // Correction to apply
  realValue: number; // Final value to use = mepValue + correctionValue
  source?: string; // Where the rate comes from
  createdAt: string;
  updatedAt: string;
}

// ========== SERVICES TABLE (Utilities, Bills) ==========
export interface Service {
  id: string;
  type: 'electricity' | 'gas' | 'phone' | 'water' | 'internet' | 'taxes' | 'other';
  description: string;
  dueDate: string; // 'YYYY-MM-DD'
  amountPesos: number;
  amountDollars?: number;
  isPaid: boolean;
  paidDate?: string; // 'YYYY-MM-DD'
  month: string; // 'YYYY-MM'
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ========== DEBTS TABLE ==========
export interface Debt {
  id: string;
  description: string;
  currentPaymentNumber: number;
  maxPaymentNumber: number; // 0 = applies all months, 1 = one payment only, >1 = specific months
  amountPerPayment: number;
  month: string; // 'YYYY-MM'
  isPaid: boolean;
  paidDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ========== EXPENSES TABLE ==========
export interface Expense {
  id: string;
  description: string;
  amountPesos: number;
  amountDollars: number;
  status: 'done' | 'now' | 'later'; // done=paid, now=pay now, later=plan for later
  month: string; // 'YYYY-MM'
  fromCreditCard: boolean; // true if from CC audit, false if manual entry
  creditCardId?: string; // Link to CreditCard if applicable
  category?: string; // Optional categorization
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ========== MONTH/YEAR SUMMARY ==========
export interface MonthlySummary {
  month: string; // 'YYYY-MM'
  year: number;
  creditCardTotal: number;
  investmentTotal: number;
  carSavingsTotal: number;
  servicesTotal: number;
  debtsTotal: number;
  expensesTotal: number;
  grandTotal: number;
  dollarRate: number;
}

// ========== CONFIG ==========
export interface TabConfig {
  id: string;
  label: string;
  icon: string;
  route: string;
  order: number;
}

export interface AppConfig {
  tabs: TabConfig[];
  currency: 'ARS' | 'USD';
  locale: string;
  theme: 'light' | 'dark';
}

// ========== USER / AUTH ========== 
export interface User {
  id: string;
  email: string;
  name: string;
  photoUrl?: string;
  provider: 'google' | 'email' | 'local'; // 'local' = test, 'google' = future
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// ========== STORAGE DATA ==========
export interface StorageData {
  // User
  currentUserId: string | null; // Current logged-in user
  
  // Base entities (static info)
  creditCards: CreditCard[];
  investments: Investment[];
  
  // Monthly variations (dynamic per month)
  creditCardsMonthly: CreditCardMonthly[];
  investmentsMonthly: InvestmentMonthly[];
  
  // Other tables (monthly entries)
  carSavings: CarSavings[];
  dollarRates: DollarRate[];
  services: Service[];
  debts: Debt[];
  expenses: Expense[];
  
  // Config
  config: AppConfig;
}
