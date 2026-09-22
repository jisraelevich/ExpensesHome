import React, { useState } from 'react';
import { CreditCard, CreditCardMonthly } from '../types';
import { generateId, getCurrentDate, formatMoneyInput, parseMoneyInput } from '../utils/helpers';
import './forms.css';

interface CreditCardMonthlyFormProps {
  month: string;
  creditCard: CreditCard;
  onSave: (monthly: CreditCardMonthly) => Promise<void>;
  onCancel: () => void;
  initialData?: CreditCardMonthly;
}

export default function CreditCardMonthlyForm({
  month,
  creditCard,
  onSave,
  onCancel,
  initialData,
}: CreditCardMonthlyFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<CreditCardMonthly>>(
    initialData || {
      creditCardId: creditCard.id,
      month,
      amountPesos: 0,
      amountDollars: 0,
      closeDate: 5,
      dueDate: 15,
      isPaid: false,
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const now = getCurrentDate();
      const monthlyData: CreditCardMonthly = {
        id: initialData?.id || generateId(),
        creditCardId: formData.creditCardId || creditCard.id,
        month: formData.month || month,
        amountPesos: formData.amountPesos || 0,
        amountDollars: formData.amountDollars || 0,
        closeDate: formData.closeDate || 1,
        dueDate: formData.dueDate || 15,
        isPaid: formData.isPaid || false,
        paidDate: formData.paidDate,
        createdAt: initialData?.createdAt || now,
        updatedAt: now,
      };

      await onSave(monthlyData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      {/* Card Info Header */}
      <div style={{ marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #eee' }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: '13px', color: '#333' }}>
          {creditCard.bankName} • {creditCard.cardType.toUpperCase()}
        </p>
        <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#999' }}>
          {month}
        </p>
      </div>

      {/* Amount Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Amount (ARS) *</label>
          <input
            type="text"
            inputMode="decimal"
            className="money-input"
            value={formatMoneyInput(formData.amountPesos || 0)}
            onChange={(e) => setFormData({ ...formData, amountPesos: parseMoneyInput(e.target.value) })}
            onFocus={(e) => e.target.select()}
            required
            placeholder="0.00"
            style={{ 
              width: '100%',
              padding: '6px 8px',
              fontSize: '13px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Amount (USD) *</label>
          <input
            type="text"
            inputMode="decimal"
            className="money-input"
            value={formatMoneyInput(formData.amountDollars || 0)}
            onChange={(e) => setFormData({ ...formData, amountDollars: parseMoneyInput(e.target.value) })}
            onFocus={(e) => e.target.select()}
            required
            placeholder="0.00"
            style={{ 
              width: '100%',
              padding: '6px 8px',
              fontSize: '13px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
            className="money-input"
          />
        </div>
      </div>

      {/* Dates Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Close (Day) *</label>
          <input
            type="number"
            min="1"
            max="31"
            value={formData.closeDate || 5}
            onChange={(e) => setFormData({ ...formData, closeDate: parseInt(e.target.value) })}
            onFocus={(e) => e.target.select()}
            required
            style={{ 
              width: '100%',
              padding: '6px 8px',
              fontSize: '13px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
            className="money-input"
          />
        </div>
        <div>
          <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Due (Day) *</label>
          <input
            type="number"
            min="1"
            max="31"
            value={formData.dueDate || 15}
            onChange={(e) => setFormData({ ...formData, dueDate: parseInt(e.target.value) })}
            onFocus={(e) => e.target.select()}
            required
            style={{ 
              width: '100%',
              padding: '6px 8px',
              fontSize: '13px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
            className="money-input"
          />
        </div>
      </div>

      {/* Status Row */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={formData.isPaid || false}
            onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <span>Paid</span>
        </label>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="submit"
          className="button button-primary"
          disabled={loading}
          style={{ flex: 1, padding: '6px 12px', fontSize: '13px' }}
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          className="button button-secondary"
          onClick={onCancel}
          disabled={loading}
          style={{ flex: 1, padding: '6px 12px', fontSize: '13px' }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
