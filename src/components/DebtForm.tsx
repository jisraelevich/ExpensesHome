import { useState } from 'react';
import { Debt } from '../types';
import { generateId, getCurrentDate } from '../utils/helpers';
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
      name: '',
      isActive: true,
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const now = getCurrentDate();
      const debt: Debt = {
        id: initialData?.id || generateId(),
        name: formData.name || '',
        isActive: formData.isActive !== false,
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
          <label>Debt Name *</label>
          <input
            type="text"
            className="input-field"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            onFocus={(e) => e.target.select()}
            placeholder="e.g., Personal Loan - Bank A, Car Loan"
            required
          />
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
          <small style={{ color: '#999' }}>Uncheck to archive this debt</small>
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
