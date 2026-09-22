import React from 'react';
import { useTable, useCurrentMonth } from '../hooks';
import { CreditCard, CreditCardMonthly, Investment, InvestmentMonthly, Service, Debt, DebtMonthly, Expense, DollarRate } from '../types';
import { StorageData } from '../types';
import { formatCurrency, formatDate, getMonthName } from '../utils/helpers';

interface DashboardPageProps {
  data: StorageData;
  month: string;
}

export default function DashboardPage({ data, month }: DashboardPageProps) {
  const { items: creditCards } = useTable<CreditCard>('creditCards');
  const { items: creditCardsMonthly } = useTable<CreditCardMonthly>('creditCardsMonthly');
  const { items: investments } = useTable<Investment>('investments');
  const { items: investmentsMonthly } = useTable<InvestmentMonthly>('investmentsMonthly');
  const { items: debts } = useTable<Debt>('debts');
  const { items: debtsMonthly } = useTable<DebtMonthly>('debtsMonthly');
  const { items: services } = useTable<Service>('services');
  const { items: expenses } = useTable<Expense>('expenses');
  const { items: dollarRates } = useTable<DollarRate>('dollarRates');

  // Filter by current month (matrix structure)
  const currentMonthCC = creditCardsMonthly.filter((ccm) => ccm.month === month && creditCards.find(cc => cc.id === ccm.creditCardId && cc.isActive));
  const currentMonthInv = investmentsMonthly.filter((im) => im.month === month && investments.find(inv => inv.id === im.investmentId && inv.isActive));
  const currentMonthDebt = debtsMonthly.filter((dm) => dm.month === month && debts.find(d => d.id === dm.debtId && d.isActive));
  const currentMonthSvc = services.filter((svc) => svc.month === month);
  const currentMonthExp = expenses.filter((exp) => exp.month === month);

  // Calculate totals
  const totalCC = currentMonthCC.reduce((sum, ccm) => sum + ccm.amountPesos, 0);
  const totalInv = currentMonthInv.reduce((sum, im) => sum + im.amountPerPayment, 0);
  const totalDebt = currentMonthDebt.reduce((sum, dm) => sum + dm.subpayments.reduce((s, sp) => s + sp.amount, 0), 0);
  const totalSvc = currentMonthSvc.reduce((sum, svc) => sum + svc.amountPesos, 0);
  const totalExp = currentMonthExp.reduce((sum, exp) => sum + exp.amountPesos, 0);
  const grandTotal = totalCC + totalInv + totalDebt + totalSvc + totalExp;

  // Get latest dollar rate
  const latestRate = dollarRates && dollarRates.length > 0
    ? dollarRates[dollarRates.length - 1]
    : null;

  const totalInDollars = latestRate ? grandTotal / latestRate.realValue : 0;

  return (
    <div className="page">
      <div className="page-header">
        <h2>📊 Dashboard</h2>
        <p style={{ margin: 0, color: '#666' }}>Month: {getMonthName(month)}</p>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">Credit Cards</div>
          <div className="stat-card-value">${totalCC.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}</div>
          <div className="stat-card-change">{currentMonthCC.length} cards</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Investments</div>
          <div className="stat-card-value">${totalInv.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}</div>
          <div className="stat-card-change">{currentMonthInv.length} items</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Services/Bills</div>
          <div className="stat-card-value">${totalSvc.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}</div>
          <div className="stat-card-change">{currentMonthSvc.length} bills</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Debts</div>
          <div className="stat-card-value">${totalDebt.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}</div>
          <div className="stat-card-change">{currentMonthDebt.length} payments</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Expenses</div>
          <div className="stat-card-value">${totalExp.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}</div>
          <div className="stat-card-change">{currentMonthExp.length} entries</div>
        </div>
      </div>

      {/* Grand Total */}
      <div className="card">
        <div className="card-header">
          <h3>Monthly Summary</h3>
        </div>
        <div className="card-content">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <p style={{ color: '#666', margin: '0 0 8px 0', fontSize: '12px' }}>Total in Pesos</p>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: 600, color: '#333' }}>
                ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p style={{ color: '#666', margin: '0 0 8px 0', fontSize: '12px' }}>Total in Dollars</p>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: 600, color: '#333' }}>
                USD {totalInDollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            {latestRate && (
              <div>
                <p style={{ color: '#666', margin: '0 0 8px 0', fontSize: '12px' }}>Current Exchange Rate</p>
                <p style={{ margin: 0, fontSize: '32px', fontWeight: 600, color: '#667eea' }}>
                  {latestRate.realValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p style={{ color: '#999', margin: '4px 0 0 0', fontSize: '11px' }}>ARS/USD</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="card">
        <div className="card-header">
          <h3>Quick Actions</h3>
        </div>
        <div className="card-content">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
            <button className="button button-primary">Add Credit Card</button>
            <button className="button button-primary">Add Expense</button>
            <button className="button button-secondary">Export Report</button>
            <button className="button button-secondary">Import Data</button>
          </div>
        </div>
      </div>
    </div>
  );
}
