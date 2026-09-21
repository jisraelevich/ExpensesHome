import React, { useState } from 'react';
import { useTable } from '../hooks';
import { DollarRate } from '../types';
import { generateId, getCurrentDate } from '../utils/helpers';

interface DollarRatesPageProps {
  month: string;
  onRefresh: () => void;
}

export default function DollarRatesPage({ month, onRefresh }: DollarRatesPageProps) {
  const { items, addItem } = useTable<DollarRate>('dollarRates');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: `${month}-01`,
    mepValue: 200,
    correctionValue: 0,
    source: 'Manual Entry',
  });

  // Show all rates (not filtered by month, as these are global rates)
  // But highlight the most recent one for the current month
  const sortedRates = [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestRate = sortedRates[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const realValue = formData.mepValue + formData.correctionValue;
    
    await addItem({
      id: generateId(),
      date: formData.date,
      mepValue: formData.mepValue,
      correctionValue: formData.correctionValue,
      realValue: realValue,
      source: formData.source,
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    });

    setFormData({
      date: `${month}-01`,
      mepValue: 200,
      correctionValue: 0,
      source: 'Manual Entry',
    });
    setShowForm(false);
    onRefresh();
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>💵 Dollar Exchange Rates (Historical)</h2>
        <button 
          className="button button-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Add Rate'}
        </button>
      </div>

      {/* Current Rate Summary */}
      {latestRate && (
        <div className="card" style={{ background: '#f0f9ff', borderLeft: '4px solid #0066cc' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#0066cc' }}>Latest Rate: {latestRate.date}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666' }}>MEP Value</p>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
                ${latestRate.mepValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666' }}>Correction</p>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: latestRate.correctionValue >= 0 ? '#28a745' : '#dc3545' }}>
                {latestRate.correctionValue >= 0 ? '+' : ''}{latestRate.correctionValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666' }}>Real Rate (To Use)</p>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#0066cc' }}>
                ${latestRate.realValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Rate Form */}
      {showForm && (
        <div className="card">
          <h3>Add New Exchange Rate</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                className="input-field"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>MEP Rate</label>
              <input
                type="number"
                step="0.01"
                className="input-field"
                value={formData.mepValue}
                onChange={(e) => setFormData({ ...formData, mepValue: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div className="form-group">
              <label>Correction Value</label>
              <input
                type="number"
                step="0.01"
                className="input-field"
                value={formData.correctionValue}
                onChange={(e) => setFormData({ ...formData, correctionValue: parseFloat(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label>Source</label>
              <input
                type="text"
                className="input-field"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '8px' }}>
              <button type="submit" className="button button-primary">Save Rate</button>
              <button type="button" className="button button-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Historical Rates */}
      {sortedRates.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#999' }}>No rates recorded yet</p>
        </div>
      ) : (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Historical Rates</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>MEP Rate</th>
                <th>Correction</th>
                <th>Real Rate (Used)</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {sortedRates.map((rate) => (
                <tr key={rate.id} style={{ background: rate.id === latestRate?.id ? '#f0f9ff' : 'transparent' }}>
                  <td><strong>{rate.date}</strong></td>
                  <td>${rate.mepValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td style={{ color: rate.correctionValue >= 0 ? '#28a745' : '#dc3545' }}>
                    {rate.correctionValue >= 0 ? '+' : ''}{rate.correctionValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ fontWeight: 600, color: '#0066cc' }}>
                    ${rate.realValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td>{rate.source || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
