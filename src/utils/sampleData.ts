import { generateId, getCurrentDate, getCurrentMonth } from '../utils/helpers';
import { CreditCard, Investment, CarSavings, DollarRate, Service, Debt, Expense } from '../types';

/**
 * Sample data generator for development/testing
 */

export function generateSampleCreditCards(): CreditCard[] {
  const month = getCurrentMonth();
  return [
    {
      id: generateId(),
      bankName: 'Banco Santander',
      cardType: 'visa',
      closeDate: 5,
      dueDate: 15,
      month,
      amountPesos: 15000,
      amountDollars: 75.25,
      isPaid: false,
      notes: 'Shopping and utilities',
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    },
    {
      id: generateId(),
      bankName: 'BBVA',
      cardType: 'mastercard',
      closeDate: 10,
      dueDate: 20,
      month,
      amountPesos: 8500.50,
      amountDollars: 42.75,
      isPaid: false,
      notes: 'Personal expenses',
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    },
  ];
}

export function generateSampleInvestments(): Investment[] {
  const month = getCurrentMonth();
  return [
    {
      id: generateId(),
      broker: 'Broker A',
      type: 'insurance',
      year: 2026,
      currentPaymentNumber: 3,
      totalPayments: 12,
      amountPerPayment: 2500,
      month,
      isPaid: false,
      comment: 'Life insurance policy',
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    },
  ];
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
  const month = getCurrentMonth();
  return [
    {
      id: generateId(),
      description: 'Personal Loan - Bank A',
      currentPaymentNumber: 5,
      maxPaymentNumber: 24,
      amountPerPayment: 2000,
      month,
      isPaid: false,
      notes: '24 month plan',
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    },
  ];
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

export function generateAllSampleData() {
  return {
    creditCards: generateSampleCreditCards(),
    investments: generateSampleInvestments(),
    carSavings: generateSampleCarSavings(),
    dollarRates: generateSampleDollarRates(),
    services: generateSampleServices(),
    debts: generateSampleDebts(),
    expenses: generateSampleExpenses(),
  };
}
