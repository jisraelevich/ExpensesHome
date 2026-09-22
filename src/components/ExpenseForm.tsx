import React, { useState } from 'react';
import { Expense } from '../types';
import { generateId, getCurrentDate, formatMoneyInput, parseMoneyInput } from '../utils/helpers';
import './forms.css';

interface ExpenseFormProps {
  month: string;
  dollarRate: number;
  onSave: (expense: Expense) => Promise<void>;
  onCancel: () => void;
  initialData?: Expense;
}

export default function ExpenseForm({ month, dollarRate, onSave, onCancel, initialData }: ExpenseFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Expense>>(
    initialData || {
      description: '',
      amountPesos: 0,
      amountDollars: 0,
      status: 'now',
      fromCreditCard: false,
      month,
    }
  );

  // Auto-calculate dollars from pesos if not entered
  const handlePesosChange = (pesos: number) => {
    setFormData({
      ...formData,
      amountPesos: pesos,
      amountDollars: dollarRate > 0 ? pesos / dollarRate : 0,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const now = getCurrentDate();
      const expense: Expense = {
        id: initialData?.id || generateId(),
        description: formData.description || '',
        amountPesos: formData.amountPesos || 0,
        amountDollars: formData.amountDollars || 0,
        status: (formData.status as 'done' | 'now' | 'later') || 'now',
        month: formData.month || month,
        fromCreditCard: formData.fromCreditCard || false,
        creditCardId: formData.creditCardId,
        category: formData.category,
        notes: formData.notes,
        createdAt: initialData?.createdAt || now,
        updatedAt: now,
      };

      await onSave(expense);
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
            placeholder="e.g., Groceries, Gas, Dinner"
            required
          />
        </div>

        <div className="form-group">
          <label>Amount (Pesos) *</label>
          <input
            type="text"
            inputMode="decimal"
            className="input-field"
            value={formatMoneyInput(formData.amountPesos || 0)}
            onChange={(e) => handlePesosChange(parseMoneyInput(e.target.value))}
            onFocus={(e) => e.target.select()}
            placeholder="0.00"
            required
          />
        </div>

        <div className="form-group">
          <label>Amount (Dollars)</label>
          <input
            type="text"
            inputMode="decimal"
            className="input-field"
            value={formatMoneyInput(formData.amountDollars || 0)}
            onChange={(e) => setFormData({ ...formData, amountDollars: parseMoneyInput(e.target.value) })}
            onFocus={(e) => e.target.select()}
            placeholder="0.00"
          />
          <small style={{ color: '#999' }}>Auto-calculated from pesos at ${dollarRate.toFixed(2)}</small>
        </div>

        <div className="form-group">
          <label>Category</label>
          <input
            type="text"
            className="input-field"
            value={formData.category || ''}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            onFocus={(e) => e.target.select()}
            placeholder="e.g., Food, Transport, Entertainment"
          />
        </div>

        <div className="form-group">
          <label>Status *</label>
          <select
            className="input-field"
            value={formData.status || 'now'}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            required
          >
            <option value="done">Done (Already Paid)</option>
            <option value="now">Now (Pay Now)</option>
            <option value="later">Later (Plan for Later)</option>
          </select>
          <small style={{ color: '#999' }}>
            done = paid • now = pay today • later = future payment
          </small>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.fromCreditCard || false}
              onChange={(e) => setFormData({ ...formData, fromCreditCard: e.target.checked })}
            />
            From Credit Card
          </label>
        </div>

        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label>Notes</label>
          <textarea
            className="input-field"
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            onFocus={(e) => e.target.select()}
            placeholder="Optional notes"
            rows={2}
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="button button-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Expense'}
        </button>
        <button type="button" className="button button-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
