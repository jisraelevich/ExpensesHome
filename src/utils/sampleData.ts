import { generateId, getCurrentDate, getCurrentMonth } from '../utils/helpers';
import { 
  CreditCard, 
  CreditCardMonthly,
  Investment, 
  InvestmentMonthly,
  CarSavings, 
  DollarRate, 
  Service, 
  Debt,
  DebtMonthly,
  DebtSubpayment,
  Expense,
  AppConfig
} from '../types';

/**
 * Sample data generator for development/testing
 */

export function generateSampleCreditCards(): CreditCard[] {
  return [
    {
      id: generateId(),
      bankName: 'Banco Santander',
      cardType: 'visa',
      closeDate: 5,
      dueDate: 15,
      isActive: true,
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    },
    {
      id: generateId(),
      bankName: 'BBVA',
      cardType: 'mastercard',
      closeDate: 10,
      dueDate: 20,
      isActive: true,
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    },
  ];
}

export function generateSampleCreditCardsMonthly(creditCards: CreditCard[]): CreditCardMonthly[] {
  const month = getCurrentMonth();
  return creditCards.map(cc => ({
    id: generateId(),
    creditCardId: cc.id,
    month,
    amountPesos: cc.id === creditCards[0].id ? 15000 : 8500.50,
    amountDollars: cc.id === creditCards[0].id ? 75.25 : 42.75,
    isPaid: false,
    notes: cc.id === creditCards[0].id ? 'Shopping and utilities' : 'Personal expenses',
    createdAt: getCurrentDate(),
    updatedAt: getCurrentDate(),
  }));
}

export function generateSampleInvestments(): Investment[] {
  return [
    {
      id: generateId(),
      broker: 'Broker A',
      type: 'insurance',
      isActive: true,
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    },
    {
      id: generateId(),
      broker: 'Investment Fund B',
      type: 'car',
      isActive: true,
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    },
  ];
}

export function generateSampleInvestmentsMonthly(investments: Investment[]): InvestmentMonthly[] {
  const month = getCurrentMonth();
  return investments.map((inv, idx) => ({
    id: generateId(),
    investmentId: inv.id,
    month,
    currentPaymentNumber: idx + 1,
    amountPerPayment: idx === 0 ? 2500 : 5000,
    isPaid: false,
    comment: idx === 0 ? 'Life insurance policy' : 'Car savings fund',
    createdAt: getCurrentDate(),
    updatedAt: getCurrentDate(),
  }));
}

export function generateSampleCarSavings(): CarSavings[] {
  const month = getCurrentMonth();
  return [
    {
      id: generateId(),
      month,
      amountPesos: 5000,
      amountDollars: 25,
      isPaid: false,
      comment: 'Monthly deposit',
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    },
  ];
}

export function generateSampleDollarRates(): DollarRate[] {
  return [
    {
      id: generateId(),
      date: getCurrentDate(),
      mepValue: 205.5,
      correctionValue: 5,
      realValue: 210.5,
      source: 'MEP Market',
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    },
  ];
}

export function generateSampleServices(): Service[] {
  const month = getCurrentMonth();
  return [
    {
      id: generateId(),
      type: 'electricity',
      description: 'Electricity Bill',
      dueDate: `${month}-15`,
      amountPesos: 3500,
      month,
      isPaid: false,
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    },
    {
      id: generateId(),
      type: 'gas',
      description: 'Gas Bill',
      dueDate: `${month}-20`,
      amountPesos: 1200,
      month,
      isPaid: false,
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    },
  ];
}

export function generateSampleDebts(): Debt[] {
  return [
    {
      id: generateId(),
      name: 'Personal Loan - Bank A',
      isActive: true,
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    },
  ];
}

export function generateSampleDebtSubpayments(debts: Debt[]): DebtSubpayment[] {
  if (debts.length === 0) return [];
  
  const debtId = debts[0].id;
  return [
    {
      id: generateId(),
      debtId,
      description: 'Principal',
      startDate: '2026-01-01',
      amountARS: 1500,
      amountUSD: 7.50,
      totalPayments: 24, // Appears for 24 months, then disappears
      isActive: true,
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    },
    {
      id: generateId(),
      debtId,
      description: 'Interest',
      startDate: '2026-01-01',
      amountARS: 400,
      amountUSD: 2.00,
      totalPayments: 0, // Permanent (0 = unlimited)
      isActive: true,
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    },
    {
      id: generateId(),
      debtId,
      description: 'Insurance',
      startDate: '2026-09-01',
      amountARS: 100,
      amountUSD: 0.50,
      totalPayments: 1, // Only this month
      isActive: true,
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    },
  ];
}

export function generateSampleDebtMonthly(debts: Debt[], debtSubpayments: DebtSubpayment[]): DebtMonthly[] {
  const month = getCurrentMonth();
  
  return debts.map(debt => {
    const allSubpayments = debtSubpayments.filter(sp => sp.debtId === debt.id);
    
    // Filter only visible subpayments based on visibility rules
    const visibleSubpayments = allSubpayments.filter(sp => {
      const [startYear, startMonth] = sp.startDate.split('-').slice(0, 2).map(Number);
      const [targetYear, targetMonthNum] = month.split('-').map(Number);
      const monthsDiff = (targetYear - startYear) * 12 + (targetMonthNum - startMonth);
      
      // Before start date
      if (monthsDiff < 0) return false;
      
      // totalPayments = 0: permanent
      if (sp.totalPayments === 0) return true;
      
      // totalPayments = 1: only start month
      if (sp.totalPayments === 1) return monthsDiff === 0;
      
      // totalPayments > 1: visible for that many months
      return monthsDiff < sp.totalPayments;
    });
    
    return {
      id: generateId(),
      debtId: debt.id,
      month,
      subpayments: visibleSubpayments.map(sp => ({
        subpaymentId: sp.id,
        description: sp.description,
        amountARS: sp.amountARS,
        amountUSD: sp.amountUSD,
        isPaid: false,
      })),
      isPaid: false,
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    };
  });
}

export function generateSampleExpenses(): Expense[] {
  const month = getCurrentMonth();
  return [
    {
      id: generateId(),
      description: 'Groceries',
      amountPesos: 850,
      amountDollars: 4.25,
      status: 'done',
      month,
      fromCreditCard: false,
      category: 'Food',
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    },
    {
      id: generateId(),
      description: 'Gas for car',
      amountPesos: 2500,
      amountDollars: 12.5,
      status: 'done',
      month,
      fromCreditCard: false,
      category: 'Transport',
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    },
  ];
}

export function generateAllSampleData(config?: AppConfig) {
  const creditCards = generateSampleCreditCards();
  const creditCardsMonthly = generateSampleCreditCardsMonthly(creditCards);
  const investments = generateSampleInvestments();
  const investmentsMonthly = generateSampleInvestmentsMonthly(investments);
  const debts = generateSampleDebts();
  const debtSubpayments = generateSampleDebtSubpayments(debts);
  const debtsMonthly = generateSampleDebtMonthly(debts, debtSubpayments);

  return {
    creditCards,
    creditCardsMonthly,
    investments,
    investmentsMonthly,
    carSavings: generateSampleCarSavings(),
    dollarRates: generateSampleDollarRates(),
    services: generateSampleServices(),
    debts,
    debtsMonthly,
    debtSubpayments,
    expenses: generateSampleExpenses(),
    config: config || {
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
    },
  };
}
