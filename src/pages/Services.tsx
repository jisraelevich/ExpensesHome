import { useState } from 'react';
import { useTable } from '../hooks';
import { Service } from '../types';
import ServiceForm from '../components/ServiceForm';
import { getCurrentDate } from '../utils/helpers';
import './admin.css';

interface ServicesPageProps {
  month: string;
  onRefresh: () => void;
}

export default function ServicesPage({ month, onRefresh }: ServicesPageProps) {
  const { items, addItem, updateItem } = useTable<Service>('services');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | undefined>();
  
  const currentMonth = items.filter((svc) => svc.month === month);
  const totalAmount = currentMonth.reduce((sum, svc) => sum + svc.amountPesos, 0);

  const handleSave = async (service: Service) => {
    try {
      const existing = items.find((svc) => svc.id === service.id);
      if (existing) {
        await updateItem(service.id, service);
      } else {
        await addItem(service);
      }
      setShowForm(false);
      setSelectedService(undefined);
      onRefresh();
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const handleEditDueDay = async (serviceId: string, newDueDay: number) => {
    const service = currentMonth.find((s) => s.id === serviceId);
    if (service) {
      const day = Math.max(1, Math.min(31, newDueDay));
      const dueDate = `${month}-${String(day).padStart(2, '0')}`;
      await updateItem(serviceId, { dueDay: day, dueDate });
      onRefresh();
    }
  };

  const handleEditAmount = async (serviceId: string, newAmount: number) => {
    const service = currentMonth.find((s) => s.id === serviceId);
    if (service) {
      await updateItem(serviceId, { amountPesos: newAmount });
      onRefresh();
    }
  };

  const handleTogglePaid = async (serviceId: string, isPaid: boolean) => {
    const service = currentMonth.find((s) => s.id === serviceId);
    if (service) {
      const paidDate = isPaid ? getCurrentDate().split('T')[0] : undefined;
      await updateItem(serviceId, { isPaid, paidDate });
      onRefresh();
    }
  };

  const handleEditPaidDate = async (serviceId: string, newPaidDate: string) => {
    const service = currentMonth.find((s) => s.id === serviceId);
    if (service) {
      await updateItem(serviceId, { paidDate: newPaidDate });
      onRefresh();
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>🧾 Services & Bills</h2>
        <button 
          className="button button-primary"
          onClick={() => {
            setSelectedService(undefined);
            setShowForm(!showForm);
          }}
        >
          {showForm ? 'Cancel' : '+ Add Service'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <ServiceForm 
            month={month}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setSelectedService(undefined);
            }}
            initialData={selectedService}
          />
        </div>
      )}

      {currentMonth.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#999' }}>No services for this month</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="card">
            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666' }}>Total This Month</p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
              ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* List */}
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Due Day</th>
                  <th>Amount (ARS)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentMonth.map((svc) => (
                  <tr key={svc.id}>
                    <td>
                      {svc.description}
                      {svc.paymentUrl && (
                        <>
                          {' '}
                          <a
                            href={svc.paymentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open payment link"
                            style={{ marginLeft: '4px' }}
                          >
                            🔗
                          </a>
                        </>
                      )}
                    </td>
                    <td>
                      <input
                        type="number"
                        style={{
                          width: '50px',
                          padding: '4px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                        }}
                        value={svc.dueDay}
                        onChange={(e) => handleEditDueDay(svc.id, parseInt(e.target.value))}
                        min="1"
                        max="31"
                      />
                    </td>
                    <td>
                      ${svc.amountPesos.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <label style={{ cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={svc.isPaid}
                          onChange={(e) => handleTogglePaid(svc.id, e.target.checked)}
                        />
                        {svc.isPaid ? (
                          <span className="badge badge-success">✅ PAID</span>
                        ) : (
                          <span className="badge badge-warning">⏳ PENDING</span>
                        )}
                      </label>
                      {svc.isPaid && svc.paidDate && (
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          <input
                            type="date"
                            value={svc.paidDate}
                            onChange={(e) => handleEditPaidDate(svc.id, e.target.value)}
                            style={{
                              width: '120px',
                              padding: '4px',
                              border: '1px solid #ccc',
                              borderRadius: '4px',
                            }}
                          />
                        </div>
                      )}
                    </td>
                    <td>
                      <button
                        className="button button-small"
                        onClick={() => {
                          setSelectedService(svc);
                          setShowForm(true);
                        }}
                      >
                        ✏️ Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
