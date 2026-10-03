import { generateId, getCurrentDate, getCurrentMonth } from '../utils/helpers';
import { 
  CreditCard, 
  CreditCardMonthly,
  Investment, 
  InvestmentMonthly,
  DollarRate, 
  ServiceBase,
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
      isActive: true,
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    },
    {
      id: generateId(),
      bankName: 'BBVA',
      cardType: 'mastercard',
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
    closeDate: cc.id === creditCards[0].id ? 5 : 10,
    dueDate: cc.id === creditCards[0].id ? 15 : 20,
    isPaid: false,
    createdAt: getCurrentDate(),
    updatedAt: getCurrentDate(),
  }));
}

export function generateSampleInvestments(): Investment[] {
  const currentMonth = getCurrentMonth();
  const currentDate = getCurrentDate();
  
  return [
    {
      id: generateId(),
      name: 'Life Insurance Policy',
      broker: 'Broker A',
      type: 'insurance-life',
      currency: 'ARS',
      totalPayments: 120,
      startMonth: currentMonth,
      startDate: currentDate,
      isActive: true,
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    },
    {
      id: generateId(),
      name: 'Car Savings Fund',
      broker: 'Investment Fund B',
      type: 'car',
      currency: 'ARS',
      totalPayments: 60,
      startMonth: currentMonth,
      startDate: currentDate,
      isActive: true,
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    },
    {
      id: generateId(),
      name: 'P3UL118-B (Kardian Evolution 156 MT)',
      broker: 'Plan Rombo Renault',
      type: 'payment-plan',
      currency: 'ARS',
      totalPayments: 120,
      startMonth: currentMonth,
      startDate: currentDate,
      isActive: true,
      notes: 'Car payment plan - 27/120 (22.5% complete)',
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    },
  ];
}

export function generateSampleInvestmentsMonthly(investments: Investment[]): InvestmentMonthly[] {
  const month = getCurrentMonth();
  const currentDate = getCurrentDate().split('T')[0]; // Get just the date part (YYYY-MM-DD)
  
  return investments.map((inv, idx) => {
    let currentPaymentNumber = idx + 1;
    let amountPerPayment = idx === 0 ? 2500 : 5000;
    let isPaid = false;
    let paidDate: string | undefined = undefined;
    let comment = '';
    
    // Special case for Renault car payment plan
    if (idx === 2) {
      currentPaymentNumber = 27; // 27th payment
      amountPerPayment = 425000; // 425,000 ARS
      isPaid = true; // Marked as PAID (Credit Card)
      paidDate = currentDate; // Paid today
      comment = 'Payment 27/120 (22.5%) - Paid with CC';
    } else if (idx === 0) {
      comment = 'Life insurance policy';
    } else {
      comment = 'Car savings fund';
    }
    
    return {
      id: generateId(),
      investmentId: inv.id,
      month,
      currentPaymentNumber,
      amountPerPayment,
      isPaid,
      paidDate,
      comment,
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    };
  });
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

export function generateSampleServicesBases(): ServiceBase[] {
  const currentMonth = getCurrentMonth();
  return [
    {
      id: generateId(),
      type: 'electricity',
      description: 'EDESA',
      paymentUrl: 'https://www.edesa.com.ar/pagar',
      startMonth: currentMonth,
      isActive: true,
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    },
    {
      id: generateId(),
      type: 'phone',
      description: 'CLARO',
      paymentUrl: 'https://www.claro.com.ar/pagos',
      startMonth: currentMonth,
      isActive: true,
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    },
    {
      id: generateId(),
      type: 'taxes',
      description: 'AFIP',
      paymentUrl: 'https://www.afip.gob.ar',
      startMonth: currentMonth,
      isActive: true,
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    },
    {
      id: generateId(),
      type: 'other',
      description: 'CAR TAX',
      paymentUrl: '',
      startMonth: currentMonth,
      isActive: true,
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    },
  ];
}

export function generateSampleServices(servicesBases?: ServiceBase[]): Service[] {
  const month = getCurrentMonth();
  const bases = servicesBases || generateSampleServicesBases();
  
  return bases.map((base, idx) => {
    let dueDay = 15;
    let amountPesos = 3500;
    
    if (idx === 1) { // CLARO
      dueDay = 10;
      amountPesos = 2800;
    } else if (idx === 2) { // AFIP
      dueDay = 20;
      amountPesos = 1500;
    } else if (idx === 3) { // CAR TAX
      dueDay = 25;
      amountPesos = 5000;
    }
    
    const dueDate = `${month}-${String(dueDay).padStart(2, '0')}`;
    
    return {
      id: generateId(),
      serviceBaseId: base.id,
      type: base.type,
      description: base.description,
      dueDay,
      dueDate,
      amountPesos,
      isPaid: false,
      month,
      paymentUrl: base.paymentUrl,
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    };
  });
}

export function generateSampleDebts(): Debt[] {
  return [
    {
      id: generateId(),
      name: 'PSA 910 - 15C',
      isActive: true,
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    },
    {
      id: generateId(),
      name: 'Netflix',
      isActive: true,
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    },
    {
      id: generateId(),
      name: 'Cable Canal 2 VISA GAL',
      isActive: true,
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    },
  ];
}

export function generateSampleDebtSubpayments(debts: Debt[]): DebtSubpayment[] {
  if (debts.length === 0) return [];
  
  // Credit card debts
  const psa910Id = debts[0].id;    // PSA 910 - 15C
  const netflixId = debts[1]?.id;  // Netflix
  const cableId = debts[2]?.id;    // Cable Canal 2 VISA GAL
  
  const subpayments: DebtSubpayment[] = [];
  
  // PSA 910 - 15C (specific months - from clipboard data for month 2026-10)
  if (psa910Id) {
    subpayments.push({
      id: generateId(),
      debtId: psa910Id,
      description: 'Payment due 12/15',
      startDate: '2026-10-01',
      amountARS: 69933.38,
      amountUSD: 0,
      totalPayments: 1, // Only this month
      isActive: true,
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    });
  }
  
  // Netflix (permanent/recurring)
  if (netflixId) {
    subpayments.push({
      id: generateId(),
      debtId: netflixId,
      description: 'Monthly subscription',
      startDate: '2026-01-01',
      amountARS: 1000,
      amountUSD: 0,
      totalPayments: 0, // Permanent (0 = unlimited)
      isActive: true,
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    });
  }
  
  // Cable Canal 2 VISA GAL (permanent/recurring)
  if (cableId) {
    subpayments.push({
      id: generateId(),
      debtId: cableId,
      description: 'Monthly cable service',
      startDate: '2026-01-01',
      amountARS: 54800,
      amountUSD: 0,
      totalPayments: 0, // Permanent (0 = unlimited)
      isActive: true,
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    });
  }
  
  return subpayments;
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
  const serviceBases = generateSampleServicesBases();

  return {
    creditCards,
    creditCardsMonthly,
    investments,
    investmentsMonthly,
    dollarRates: generateSampleDollarRates(),
    serviceBases,
    services: generateSampleServices(serviceBases),
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
