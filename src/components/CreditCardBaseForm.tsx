import React, { useState } from 'react';
import { CreditCard } from '../types';
import { generateId, getCurrentDate } from '../utils/helpers';
import './forms.css';

interface CreditCardBaseFormProps {
  onSave: (card: CreditCard) => Promise<void>;
  onCancel: () => void;
  initialData?: CreditCard;
}

export default function CreditCardBaseForm({ onSave, onCancel, initialData }: CreditCardBaseFormProps) {
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
        isActive: formData.isActive !== undefined ? formData.isActive : true,
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        {/* Line 1: Bank Name | Card Type */}
        <div>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Bank Name *</label>
          <input
            type="text"
            className="input-field"
            value={formData.bankName || ''}
            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
            placeholder="e.g., Banco Santander"
            required
            style={{ padding: '6px 8px', fontSize: '13px', width: '100%' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Card Type *</label>
          <select
            className="input-field"
            value={formData.cardType || 'visa'}
            onChange={(e) => setFormData({ ...formData, cardType: e.target.value as any })}
            style={{ padding: '6px 8px', fontSize: '13px', width: '100%' }}
          >
            <option value="visa">Visa</option>
            <option value="mastercard">Mastercard</option>
            <option value="amex">Amex</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Line 2: Notes | Active Checkbox */}
        <div>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Notes</label>
          <input
            type="text"
            className="input-field"
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Optional notes"
            style={{ padding: '6px 8px', fontSize: '13px', width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.isActive !== false}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span>Active</span>
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="submit" className="button button-primary" disabled={loading} style={{ flex: 1, padding: '6px 12px', fontSize: '13px' }}>
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button type="button" className="button button-secondary" onClick={onCancel} style={{ flex: 1, padding: '6px 12px', fontSize: '13px' }}>
          Cancel
        </button>
      </div>
    </form>
  );
}
