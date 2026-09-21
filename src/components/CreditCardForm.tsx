import React, { useState } from 'react';
import { CreditCard } from '../types';
import { generateId, getCurrentDate } from '../utils/helpers';
import './forms.css';

interface CreditCardFormProps {
  month: string;
  onSave: (card: CreditCard) => Promise<void>;
  onCancel: () => void;
  initialData?: CreditCard;
}

export default function CreditCardForm({ month, onSave, onCancel, initialData }: CreditCardFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<CreditCard>>(
    initialData || {
      bankName: '',
      cardType: 'visa',
      closeDate: 5,
      dueDate: 15,
      amountPesos: 0,
      amountDollars: 0,
      isPaid: false,
      notes: '',
      month,
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const now = getCurrentDate();
      const card: CreditCard = {
        id: initialData?.id || generateId(),
        bankName: formData.bankName || '',
        cardType: (formData.cardType as 'visa' | 'mastercard' | 'amex' | 'other') || 'visa',
        closeDate: formData.closeDate || 1,
        dueDate: formData.dueDate || 15,
        month: formData.month || month,
        amountPesos: formData.amountPesos || 0,
        amountDollars: formData.amountDollars || 0,
        isPaid: formData.isPaid || false,
        notes: formData.notes,
        paidDate: formData.paidDate,
        createdAt: initialData?.createdAt || now,
        updatedAt: now,
      };

      await onSave(card);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="form-grid">
        <div className="form-group">
          <label>Bank Name *</label>
          <input
            type="text"
            className="input-field"
            value={formData.bankName || ''}
            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
            placeholder="e.g., Banco Santander"
            required
          />
        </div>

        <div className="form-group">
          <label>Card Type *</label>
          <select
            className="input-field"
            value={formData.cardType || 'visa'}
            onChange={(e) => setFormData({ ...formData, cardType: e.target.value as any })}
          >
            <option value="visa">Visa</option>
            <option value="mastercard">Mastercard</option>
            <option value="amex">American Express</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Close Date (Day of Month) *</label>
          <input
            type="number"
            min="1"
            max="31"
            className="input-field"
            value={formData.closeDate || 1}
            onChange={(e) => setFormData({ ...formData, closeDate: parseInt(e.target.value) })}
            required
          />
        </div>

        <div className="form-group">
          <label>Due Date (Day of Month) *</label>
          <input
            type="number"
            min="1"
            max="31"
            className="input-field"
            value={formData.dueDate || 15}
            onChange={(e) => setFormData({ ...formData, dueDate: parseInt(e.target.value) })}
            required
          />
        </div>

        <div className="form-group">
          <label>Amount (Pesos) *</label>
          <input
            type="number"
            step="0.01"
            className="input-field"
            value={formData.amountPesos || 0}
            onChange={(e) => setFormData({ ...formData, amountPesos: parseFloat(e.target.value) })}
            placeholder="0.00"
            required
          />
        </div>

        <div className="form-group">
          <label>Amount (Dollars) *</label>
          <input
            type="number"
            step="0.01"
            className="input-field"
            value={formData.amountDollars || 0}
            onChange={(e) => setFormData({ ...formData, amountDollars: parseFloat(e.target.value) })}
            placeholder="0.00"
            required
          />
        </div>

        <div className="form-group">
          <label>Status</label>
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
            />
          </div>
        )}

        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label>Notes</label>
          <textarea
            className="input-field"
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Optional notes"
            rows={3}
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="button button-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Credit Card'}
        </button>
        <button type="button" className="button button-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
