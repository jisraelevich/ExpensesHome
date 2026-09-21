import React from 'react';
import { useTable } from '../hooks';
import { CarSavings } from '../types';

interface CarSavingsPageProps {
  month: string;
  onRefresh: () => void;
}

export default function CarSavingsPage({ month, onRefresh }: CarSavingsPageProps) {
  const { items } = useTable<CarSavings>('carSavings');
  const currentMonth = items.filter((cs) => cs.month === month);

  return (
    <div className="page">
      <div className="page-header">
        <h2>🚗 Car Savings</h2>
        <button className="button button-primary">Add Payment</button>
      </div>

      {currentMonth.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#999' }}>No car savings for this month</p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount (ARS)</th>
                <th>Amount (USD)</th>
                <th>Status</th>
                <th>Comment</th>
              </tr>
            </thead>
            <tbody>
              {currentMonth.map((cs) => (
                <tr key={cs.id}>
                  <td>{cs.month}</td>
                  <td>${cs.amountPesos.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td>${(cs.amountDollars || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td>
                    <span className={`badge badge-${cs.isPaid ? 'success' : 'warning'}`}>
                      {cs.isPaid ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td>{cs.comment || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
