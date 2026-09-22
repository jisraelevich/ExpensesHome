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
  name: string; // e.g., "Vida Seguros Life Insurance", "Car Payment - Toyota"
  broker?: string; // Company name
  type: 'insurance-life' | 'insurance-other' | 'investment' | 'retirement' | 'payment-plan' | 'car' | 'other';
  currency: 'ARS' | 'USD';
  totalPayments: number; // e.g., 20, 120
  startMonth: string; // 'YYYY-MM' when this started
  startDate: string; // 'YYYY-MM-DD' exact start date
  endDate?: string; // 'YYYY-MM-DD' optional end date
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
  currentPaymentNumber: number; // Auto-calculated: months elapsed from startMonth + 1
  amountPerPayment: number; // Amount for THIS month (can vary for inflation)
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

// ========== DEBT - BASE (Admin card only) ==========
export interface Debt {
  id: string;
  name: string; // e.g., "Car Loan", "Personal Loan"
  isActive: boolean; // Can be hidden/archived
  createdAt: string;
  updatedAt: string;
}

// ========== DEBT - SUB-PAYMENT (invoice line items) ==========
export interface DebtSubpayment {
  id: string;
  debtId: string; // Link to Debt
  description: string; // e.g., "Principal", "Interest", "Fees"
  paymentNumber: number; // Which payment # starts this sub-payment (e.g., 1 = from first payment)
  initialValue: number; // Starting amount for this sub-payment
  startDate: string; // 'YYYY-MM-DD' when this sub-payment starts
  createdAt: string;
  updatedAt: string;
}

// ========== DEBT - MONTHLY VARIATION ==========
export interface DebtMonthly {
  id: string;
  debtId: string; // Link to Debt
  month: string; // 'YYYY-MM'
  currentPaymentNumber: number; // Auto-calculated: which payment # is this month
  subpayments: DebtMonthlySubpayment[]; // Array of sub-payments for this month
  isPaid: boolean; // Is entire debt payment for this month paid?
  paidDate?: string; // 'YYYY-MM-DD'
  createdAt: string;
  updatedAt: string;
}

// ========== DEBT - MONTHLY SUB-PAYMENT DATA ==========
export interface DebtMonthlySubpayment {
  subpaymentId: string; // Link to DebtSubpayment
  amount: number; // Amount for THIS month (can be changed in tab)
  isPaid: boolean; // Is this sub-payment paid?
  paidDate?: string; // 'YYYY-MM-DD'
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
