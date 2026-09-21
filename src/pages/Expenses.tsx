import React, { useState } from 'react';
import { useTable, useAppData } from '../hooks';
import { Expense } from '../types';
import ExpenseForm from '../components/ExpenseForm';

interface ExpensesPageProps {
  month: string;
  onRefresh: () => void;
}

export default function ExpensesPage({ month, onRefresh }: ExpensesPageProps) {
  const { items, addItem, updateItem } = useTable<Expense>('expenses');
  const { data } = useAppData();
  const [showForm, setShowForm] = useState(false);
  const currentMonth = items.filter((exp) => exp.month === month);

  // Get latest dollar rate for currency conversion
  const latestRate = data?.dollarRates && data.dollarRates.length > 0
    ? data.dollarRates[data.dollarRates.length - 1].realValue
    : 200;

  const statusColors: Record<string, string> = {
    done: 'success',
    now: 'warning',
    later: 'info',
  };

  const handleSave = async (expense: Expense) => {
    try {
      const existing = items.find((exp) => exp.id === expense.id);
      if (existing) {
        await updateItem(expense.id, expense);
      } else {
        await addItem(expense);
      }
      setShowForm(false);
      onRefresh();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const totalPesos = currentMonth.reduce((sum, exp) => sum + exp.amountPesos, 0);
  const totalDollars = currentMonth.reduce((sum, exp) => sum + exp.amountDollars, 0);

  return (
    <div className="page">
      <div className="page-header">
        <h2>💰 Expenses</h2>
        <button 
          className="button button-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add Expense'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <ExpenseForm 
            month={month}
            dollarRate={latestRate}
            onSave={handleSave}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {currentMonth.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#999' }}>No expenses for this month</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="card">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666' }}>Total (Pesos)</p>
                <p style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
                  ${totalPesos.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666' }}>Total (Dollars)</p>
                <p style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
                  ${totalDollars.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* List */}
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount (ARS)</th>
                  <th>Amount (USD)</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>From CC</th>
                </tr>
              </thead>
              <tbody>
                {currentMonth.map((exp) => (
                  <tr key={exp.id}>
                    <td>{exp.description}</td>
                    <td>${exp.amountPesos.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td>${exp.amountDollars.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td>{exp.category || '-'}</td>
                    <td>
                      <span className={`badge badge-${statusColors[exp.status]}`}>
                        {exp.status.toUpperCase()}
                      </span>
                    </td>
                    <td>{exp.fromCreditCard ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
