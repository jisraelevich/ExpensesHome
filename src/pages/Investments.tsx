import React from 'react';
import { useTable } from '../hooks';
import { Investment } from '../types';

interface InvestmentsPageProps {
  month: string;
  onRefresh: () => void;
}

export default function InvestmentsPage({ month, onRefresh }: InvestmentsPageProps) {
  const { items } = useTable<Investment>('investments');
  const currentMonth = items.filter((inv) => inv.month === month);

  return (
    <div className="page">
      <div className="page-header">
        <h2>📈 Investments & Insurance</h2>
        <button className="button button-primary">Add Investment</button>
      </div>

      {currentMonth.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#999' }}>No investments for this month</p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Broker</th>
                <th>Type</th>
                <th>Payment #</th>
                <th>Amount (ARS)</th>
                <th>Status</th>
                <th>Comment</th>
              </tr>
            </thead>
            <tbody>
              {currentMonth.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.broker}</td>
                  <td>{inv.type}</td>
                  <td>{inv.currentPaymentNumber} / {inv.totalPayments}</td>
                  <td>${inv.amountPerPayment.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td>
                    <span className={`badge badge-${inv.isPaid ? 'success' : 'warning'}`}>
                      {inv.isPaid ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td>{inv.comment || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
