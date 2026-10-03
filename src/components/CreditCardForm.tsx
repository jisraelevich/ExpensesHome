import { useState } from 'react';
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
      isActive: true,
      notes: '',
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
        isActive: formData.isActive !== false,
        notes: formData.notes,
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
            onFocus={(e) => e.target.select()}
            placeholder="e.g., Banco Santander, BBVA"
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
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.isActive !== false}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            Active
          </label>
          <small style={{ color: '#999' }}>Uncheck to archive this card</small>
        </div>

        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label>Notes</label>
          <textarea
            className="input-field"
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            onFocus={(e) => e.target.select()}
            placeholder="e.g., Last 4 digits: 1234, 0% promo until Dec 2026..."
            rows={2}
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
