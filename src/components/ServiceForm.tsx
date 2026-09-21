import React, { useState } from 'react';
import { Service } from '../types';
import { generateId, getCurrentDate } from '../utils/helpers';
import './forms.css';

interface ServiceFormProps {
  month: string;
  onSave: (service: Service) => Promise<void>;
  onCancel: () => void;
  initialData?: Service;
}

export default function ServiceForm({ month, onSave, onCancel, initialData }: ServiceFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Service>>(
    initialData || {
      type: 'electricity',
      description: '',
      dueDate: `${month}-15`,
      amountPesos: 0,
      isPaid: false,
      month,
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const now = getCurrentDate();
      const service: Service = {
        id: initialData?.id || generateId(),
        type: (formData.type as any) || 'electricity',
        description: formData.description || '',
        dueDate: formData.dueDate || `${month}-15`,
        amountPesos: formData.amountPesos || 0,
        amountDollars: formData.amountDollars,
        isPaid: formData.isPaid || false,
        paidDate: formData.paidDate,
        month: formData.month || month,
        notes: formData.notes,
        createdAt: initialData?.createdAt || now,
        updatedAt: now,
      };

      await onSave(service);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="form-grid">
        <div className="form-group">
          <label>Service Type *</label>
          <select
            className="input-field"
            value={formData.type || 'electricity'}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            required
          >
            <option value="electricity">⚡ Electricity</option>
            <option value="gas">🔥 Gas</option>
            <option value="phone">📱 Phone</option>
            <option value="internet">🌐 Internet</option>
            <option value="water">💧 Water</option>
            <option value="taxes">📋 Taxes</option>
            <option value="other">📌 Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Description *</label>
          <input
            type="text"
            className="input-field"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="e.g., Monthly Bill"
            required
          />
        </div>

        <div className="form-group">
          <label>Due Date *</label>
          <input
            type="date"
            className="input-field"
            value={formData.dueDate || `${month}-15`}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
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
          <label>Amount (Dollars)</label>
          <input
            type="number"
            step="0.01"
            className="input-field"
            value={formData.amountDollars || 0}
            onChange={(e) => setFormData({ ...formData, amountDollars: parseFloat(e.target.value) })}
            placeholder="0.00"
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
            rows={2}
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="button button-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Service'}
        </button>
        <button type="button" className="button button-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
