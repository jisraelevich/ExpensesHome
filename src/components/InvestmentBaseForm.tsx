import React, { useState } from 'react';
import { Investment } from '../types';
import { generateId, getCurrentDate, formatMoneyInput, parseMoneyInput } from '../utils/helpers';
import './forms.css';

interface InvestmentBaseFormProps {
  onSave: (investment: Investment) => Promise<void>;
  onCancel: () => void;
  initialData?: Investment;
}

export default function InvestmentBaseForm({ onSave, onCancel, initialData }: InvestmentBaseFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Investment>>(
    initialData || {
      name: '',
      broker: '',
      type: 'insurance-life',
      currency: 'ARS',
      totalPayments: 20,
      startDate: getCurrentDate(),
      startMonth: getCurrentDate().slice(0, 7),
      isActive: true,
      notes: '',
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const now = getCurrentDate();
      const investment: Investment = {
        id: initialData?.id || generateId(),
        name: formData.name || '',
        broker: formData.broker || '',
        type: (formData.type as any) || 'insurance-life',
        currency: (formData.currency as any) || 'ARS',
        totalPayments: formData.totalPayments || 20,
        startDate: formData.startDate || getCurrentDate(),
        startMonth: formData.startMonth || getCurrentDate().slice(0, 7),
        endDate: formData.endDate,
        isActive: formData.isActive !== undefined ? formData.isActive : true,
        notes: formData.notes,
        createdAt: initialData?.createdAt || now,
        updatedAt: now,
      };

      await onSave(investment);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        {/* Name - Full Width */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Investment Name *</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            onFocus={(e) => e.target.select()}
            placeholder="e.g., Vida Seguros Life Insurance, Car Payment - Toyota"
            required
            style={{ 
              width: '100%',
              padding: '6px 8px',
              fontSize: '13px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>

        {/* Broker */}
        <div>
          <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Company/Broker</label>
          <input
            type="text"
            value={formData.broker || ''}
            onChange={(e) => setFormData({ ...formData, broker: e.target.value })}
            onFocus={(e) => e.target.select()}
            placeholder="e.g., Vida Seguros SA"
            style={{ 
              width: '100%',
              padding: '6px 8px',
              fontSize: '13px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>

        {/* Type */}
        <div>
          <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Type *</label>
          <select
            value={formData.type || 'insurance-life'}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            required
            style={{ 
              width: '100%',
              padding: '6px 8px',
              fontSize: '13px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          >
            <option value="insurance-life">🛡️ Life Insurance</option>
            <option value="insurance-other">🛡️ Other Insurance</option>
            <option value="investment">📈 Investment</option>
            <option value="retirement">🏦 Retirement</option>
            <option value="payment-plan">💳 Payment Plan</option>
            <option value="car">🚗 Car</option>
            <option value="other">📌 Other</option>
          </select>
        </div>

        {/* Currency */}
        <div>
          <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Currency *</label>
          <select
            value={formData.currency || 'ARS'}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value as any })}
            required
            style={{ 
              width: '100%',
              padding: '6px 8px',
              fontSize: '13px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          >
            <option value="ARS">ARS (Pesos)</option>
            <option value="USD">USD (Dollars)</option>
          </select>
        </div>

        {/* Total Payments */}
        <div>
          <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Total Payments *</label>
          <input
            type="number"
            min="1"
            value={formData.totalPayments || 20}
            onChange={(e) => setFormData({ ...formData, totalPayments: parseInt(e.target.value) })}
            onFocus={(e) => e.target.select()}
            required
            style={{ 
              width: '100%',
              padding: '6px 8px',
              fontSize: '13px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>

        {/* Start Date */}
        <div>
          <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Start Date *</label>
          <input
            type="date"
            value={formData.startDate || getCurrentDate()}
            onChange={(e) => {
              const date = e.target.value;
              setFormData({ 
                ...formData, 
                startDate: date,
                startMonth: date.slice(0, 7)
              });
            }}
            onFocus={(e) => e.target.select()}
            required
            style={{ 
              width: '100%',
              padding: '6px 8px',
              fontSize: '13px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>

        {/* End Date */}
        <div>
          <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>End Date (Optional)</label>
          <input
            type="date"
            value={formData.endDate || ''}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value || undefined })}
            onFocus={(e) => e.target.select()}
            style={{ 
              width: '100%',
              padding: '6px 8px',
              fontSize: '13px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>

        {/* Active */}
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <label style={{ fontSize: '12px', display: 'flex', gap: '4px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.isActive !== undefined ? formData.isActive : true}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span>Active</span>
          </label>
        </div>
      </div>

      {/* Notes - Full Width */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Notes</label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          onFocus={(e) => e.target.select()}
          placeholder="Optional notes about this investment..."
          style={{ 
            width: '100%',
            padding: '6px 8px',
            fontSize: '13px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontFamily: 'inherit',
            minHeight: '60px',
            resize: 'vertical'
          }}
        />
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
