import { useState } from 'react';
import { ServiceBase } from '../types';
import { generateId, getCurrentDate, getCurrentMonth } from '../utils/helpers';
import './forms.css';

interface ServiceBaseFormProps {
  onSave: (service: ServiceBase) => Promise<void>;
  onCancel: () => void;
  initialData?: ServiceBase;
}

export default function ServiceBaseForm({ onSave, onCancel, initialData }: ServiceBaseFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<ServiceBase>>(
    initialData || {
      type: 'electricity',
      description: '',
      paymentUrl: '',
      startMonth: getCurrentMonth(),
      isActive: true,
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const now = getCurrentDate();
      const service: ServiceBase = {
        id: initialData?.id || generateId(),
        type: (formData.type as any) || 'electricity',
        description: formData.description || '',
        paymentUrl: formData.paymentUrl || '',
        startMonth: formData.startMonth || getCurrentMonth(),
        isActive: formData.isActive !== undefined ? formData.isActive : true,
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
            <option value="electricity">⚡ Electricity (EDESA)</option>
            <option value="gas">🔥 Gas</option>
            <option value="phone">📱 Phone (CLARO)</option>
            <option value="internet">🌐 Internet</option>
            <option value="water">💧 Water</option>
            <option value="taxes">📋 Taxes (AFIP)</option>
            <option value="other">🚗 Other (CAR TAX)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Description (Name) *</label>
          <input
            type="text"
            className="input-field"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            onFocus={(e) => e.target.select()}
            placeholder="e.g., EDESA, CLARO, AFIP, CAR TAX"
            required
          />
        </div>

        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label>Payment URL (Link to Pay)</label>
          <input
            type="url"
            className="input-field"
            value={formData.paymentUrl || ''}
            onChange={(e) => setFormData({ ...formData, paymentUrl: e.target.value })}
            onFocus={(e) => e.target.select()}
            placeholder="e.g., https://www.edesa.com.ar/pagar"
          />
        </div>

        <div className="form-group">
          <label>Start Month *</label>
          <input
            type="month"
            className="input-field"
            value={formData.startMonth || getCurrentMonth()}
            onChange={(e) => setFormData({ ...formData, startMonth: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.isActive !== undefined ? formData.isActive : true}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            Active
          </label>
        </div>
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
