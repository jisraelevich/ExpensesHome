import React, { useState } from 'react';
import { useTable } from '../hooks';
import { Debt } from '../types';
import DebtForm from '../components/DebtForm';

interface DebtsPageProps {
  month: string;
  onRefresh: () => void;
}

export default function DebtsPage({ month, onRefresh }: DebtsPageProps) {
  const { items, addItem, updateItem } = useTable<Debt>('debts');
  const [showForm, setShowForm] = useState(false);
  const currentMonth = items.filter((debt) => debt.month === month);

  const handleSave = async (debt: Debt) => {
    try {
      const existing = items.find((d) => d.id === debt.id);
      if (existing) {
        await updateItem(debt.id, debt);
      } else {
        await addItem(debt);
      }
      setShowForm(false);
      onRefresh();
    } catch (error) {
      console.error('Error saving debt:', error);
    }
  };

  const totalAmount = currentMonth.reduce((sum, debt) => sum + debt.amountPerPayment, 0);

  return (
    <div className="page">
      <div className="page-header">
        <h2>📝 Debts</h2>
        <button 
          className="button button-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add Debt'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <DebtForm 
            month={month}
            onSave={handleSave}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {currentMonth.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#999' }}>No debts for this month</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="card">
            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666' }}>Total This Month</p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
              ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* List */}
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Payment #</th>
                  <th>Max Payments</th>
                  <th>Amount (ARS)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {currentMonth.map((debt) => (
                  <tr key={debt.id}>
                    <td>{debt.description}</td>
                    <td>{debt.currentPaymentNumber}</td>
                    <td>{debt.maxPaymentNumber === 0 ? '∞' : debt.maxPaymentNumber}</td>
                    <td>${debt.amountPerPayment.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td>
                      <span className={`badge badge-${debt.isPaid ? 'success' : 'warning'}`}>
                        {debt.isPaid ? 'Paid' : 'Pending'}
                      </span>
                    </td>
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
