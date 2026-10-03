import { useState } from 'react';
import { Service } from '../types';
import { generateId, getCurrentDate, formatMoneyInput, parseMoneyInput } from '../utils/helpers';
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
      dueDay: 15,
      dueDate: `${month}-15`,
      amountPesos: 0,
      isPaid: false,
      month,
    }
  );

  const handleDueDayChange = (dueDay: number) => {
    // Clamp to valid day range
    const day = Math.max(1, Math.min(31, dueDay));
    const dueDate = `${month}-${String(day).padStart(2, '0')}`;
    setFormData({ ...formData, dueDay: day, dueDate });
  };

  const handleIsPaidChange = (isPaid: boolean) => {
    if (isPaid && !formData.paidDate) {
      // Auto-set paidDate to today when marking as paid
      setFormData({ ...formData, isPaid, paidDate: getCurrentDate().split('T')[0] });
    } else {
      setFormData({ ...formData, isPaid });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const now = getCurrentDate();
      const service: Service = {
        id: initialData?.id || generateId(),
        serviceBaseId: initialData?.serviceBaseId,
        type: (formData.type as any) || 'electricity',
        description: formData.description || '',
        dueDay: formData.dueDay || 15,
        dueDate: formData.dueDate || `${month}-15`,
        amountPesos: formData.amountPesos || 0,
        isPaid: formData.isPaid || false,
        paidDate: formData.paidDate,
        month: formData.month || month,
        paymentUrl: formData.paymentUrl,
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
          <label>Service: {formData.description}</label>
          <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>{formData.type}</p>
        </div>

        <div className="form-group">
          <label>Due Day of Month *</label>
          <input
            type="number"
            className="input-field"
            value={formData.dueDay || 15}
            onChange={(e) => handleDueDayChange(parseInt(e.target.value) || 15)}
            min="1"
            max="31"
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
            onChange={(e) => setFormData({ ...formData, amountPesos: parseMoneyInput(e.target.value) })}
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
              onChange={(e) => handleIsPaidChange(e.target.checked)}
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

        {formData.paymentUrl && (
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Payment Link</label>
            <a
              href={formData.paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="button button-secondary"
              style={{ textDecoration: 'none', display: 'inline-block' }}
            >
              🔗 Pay Now
            </a>
          </div>
        )}
      </div>

      <div className="form-actions">
        <button type="submit" className="button button-primary" disabled={loading}>
          {loading ? 'Saving...' : initialData ? 'Update Service' : 'Add Service'}
        </button>
        <button type="button" className="button button-secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
      </div>
    </form>
  );
}
