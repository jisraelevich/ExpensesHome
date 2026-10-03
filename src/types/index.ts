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

// ========== SERVICES BASE (Admin - Recurring definitions) ==========
export interface ServiceBase {
  id: string;
  type: 'electricity' | 'gas' | 'phone' | 'water' | 'internet' | 'taxes' | 'other';
  description: string; // e.g., "EDESA", "CLARO", "AFIP", "CAR TAX"
  paymentUrl?: string; // URL where to pay (e.g., https://www.edesa.com.ar/pagar)
  startMonth: string; // 'YYYY-MM' - When this service starts (appears in this month and all future months)
  isActive: boolean; // Can be hidden/archived
  createdAt: string;
  updatedAt: string;
}

// ========== SERVICES TABLE (Monthly instances) ==========
export interface Service {
  id: string;
  serviceBaseId?: string; // Link to ServiceBase if recurring
  type: 'electricity' | 'gas' | 'phone' | 'water' | 'internet' | 'taxes' | 'other';
  description: string;
  dueDay: number; // Day of month (1-31) - editable per month
  dueDate: string; // 'YYYY-MM-DD' - Full date (constructed from dueDay + month)
  amountPesos: number; // Amount in ARS - editable per month
  isPaid: boolean;
  paidDate?: string; // 'YYYY-MM-DD' - Auto-set to today when marked paid, can be modified
  month: string; // 'YYYY-MM'
  paymentUrl?: string; // URL where to pay (copied from ServiceBase)
  createdAt: string;
  updatedAt: string;
}

// ========== DEBT - BASE (Admin card only) ==========
export interface Debt {
  id: string;
  name: string; // e.g., "Car Loan", "Personal Loan"
  isActive: boolean; // Can be hidden/archived
  isExpense?: boolean; // Track as expense in Expenses tab
  createdAt: string;
  updatedAt: string;
}

// ========== DEBT - SUB-PAYMENT (invoice line items) ==========
export interface DebtSubpayment {
  id: string;
  debtId: string; // Link to Debt
  description: string; // e.g., "Principal", "Interest", "Fees"
  startDate: string; // 'YYYY-MM-DD' when this line item starts
  amountARS: number; // ARS amount
  amountUSD: number; // USD amount
  totalPayments: number; // How many months this appears (0 = permanent/unlimited, 1 = this month only, 24 = appears 24 months)
  isActive: boolean; // Can toggle on/off in admin
  createdAt: string;
  updatedAt: string;
}

// ========== DEBT - MONTHLY VARIATION ==========
export interface DebtMonthly {
  id: string;
  debtId: string; // Link to Debt
  month: string; // 'YYYY-MM'
  subpayments: DebtMonthlySubpayment[]; // Array of active sub-payments for this month (auto-filtered by visibility rules)
  isPaid: boolean; // Is entire debt payment for this month paid?
  paidDate?: string; // 'YYYY-MM-DD'
  createdAt: string;
  updatedAt: string;
}

// ========== DEBT - MONTHLY SUB-PAYMENT DATA ==========
export interface DebtMonthlySubpayment {
  subpaymentId: string; // Link to DebtSubpayment
  description: string; // Cached from DebtSubpayment for easy display
  amountARS: number; // Amount for THIS month (can be changed in tab)
  amountUSD: number; // USD amount for THIS month
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
  isFromRule?: boolean; // true if auto-generated from a rule (read-only except status)
  createdAt: string;
  updatedAt: string;
}

// ========== MONTH/YEAR SUMMARY ==========
export interface MonthlySummary {
  month: string; // 'YYYY-MM'
  year: number;
  creditCardTotal: number;
  investmentTotal: number;
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
  // Base entities (static info)
  creditCards: CreditCard[];
  investments: Investment[];
  debts: Debt[];
  serviceBases: ServiceBase[];
  
  // Monthly variations (dynamic per month)
  creditCardsMonthly: CreditCardMonthly[];
  investmentsMonthly: InvestmentMonthly[];
  dollarRates: DollarRate[];
  services: Service[];
  expenses: Expense[];
  
  // Debt sub-payments and monthly tracking
  debtSubpayments: DebtSubpayment[];
  debtsMonthly: DebtMonthly[];
  
  // Config
  config: AppConfig;
}
