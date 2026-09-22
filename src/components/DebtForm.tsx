import React, { useState } from 'react';
import { Debt } from '../types';
import { generateId, getCurrentDate, formatMoneyInput, parseMoneyInput } from '../utils/helpers';
import './forms.css';

interface DebtFormProps {
  month: string;
  onSave: (debt: Debt) => Promise<void>;
  onCancel: () => void;
  initialData?: Debt;
}

export default function DebtForm({ month, onSave, onCancel, initialData }: DebtFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Debt>>(
    initialData || {
      description: '',
      currentPaymentNumber: 1,
      maxPaymentNumber: 12,
      amountPerPayment: 0,
      isPaid: false,
      month,
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const now = getCurrentDate();
      const debt: Debt = {
        id: initialData?.id || generateId(),
        description: formData.description || '',
        currentPaymentNumber: formData.currentPaymentNumber || 1,
        maxPaymentNumber: formData.maxPaymentNumber || 0,
        amountPerPayment: formData.amountPerPayment || 0,
        month: formData.month || month,
        isPaid: formData.isPaid || false,
        paidDate: formData.paidDate,
        notes: formData.notes,
        createdAt: initialData?.createdAt || now,
        updatedAt: now,
      };

      await onSave(debt);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="form-grid">
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label>Description *</label>
          <input
            type="text"
            className="input-field"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            onFocus={(e) => e.target.select()}
            placeholder="e.g., Personal Loan - Bank A"
            required
          />
        </div>

        <div className="form-group">
          <label>Current Payment Number *</label>
          <input
            type="number"
            min="1"
            className="input-field"
            value={formData.currentPaymentNumber || 1}
            onChange={(e) => setFormData({ ...formData, currentPaymentNumber: parseInt(e.target.value) })}
            onFocus={(e) => e.target.select()}
            required
          />
        </div>

        <div className="form-group">
          <label>Max Payment Number *</label>
          <input
            type="number"
            min="0"
            className="input-field"
            value={formData.maxPaymentNumber || 0}
            onChange={(e) => setFormData({ ...formData, maxPaymentNumber: parseInt(e.target.value) })}
            onFocus={(e) => e.target.select()}
            required
          />
          <small style={{ color: '#999' }}>0 = applies all months, 1 = one-time, n = specific months</small>
        </div>

        <div className="form-group">
          <label>Amount per Payment *</label>
          <input
            type="text"
            inputMode="decimal"
            className="input-field"
            value={formatMoneyInput(formData.amountPerPayment || 0)}
            onChange={(e) => setFormData({ ...formData, amountPerPayment: parseMoneyInput(e.target.value) })}
            onFocus={(e) => e.target.select()}
            placeholder="0.00"
            required
          />
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.isPaid || false}
              onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
            />
            Mark as Paid
          </label>
        </div>

        {formData.isPaid && (
          <div className="form-group">
            <label>Paid Date</label>
            <input
              type="date"
              className="input-field"
              value={formData.paidDate || ''}
              onChange={(e) => setFormData({ ...formData, paidDate: e.target.value })}
              onFocus={(e) => e.target.select()}
            />
          </div>
        )}

        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label>Notes</label>
          <textarea
            className="input-field"
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            onFocus={(e) => e.target.select()}
            placeholder="e.g., 24-month plan, interest rate..."
            rows={2}
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="button button-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Debt'}
        </button>
        <button type="button" className="button button-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
