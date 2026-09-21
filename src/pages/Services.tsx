import React, { useState } from 'react';
import { useTable } from '../hooks';
import { Service } from '../types';
import ServiceForm from '../components/ServiceForm';

interface ServicesPageProps {
  month: string;
  onRefresh: () => void;
}

export default function ServicesPage({ month, onRefresh }: ServicesPageProps) {
  const { items, addItem, updateItem } = useTable<Service>('services');
  const [showForm, setShowForm] = useState(false);
  const currentMonth = items.filter((svc) => svc.month === month);

  const handleSave = async (service: Service) => {
    try {
      const existing = items.find((svc) => svc.id === service.id);
      if (existing) {
        await updateItem(service.id, service);
      } else {
        await addItem(service);
      }
      setShowForm(false);
      onRefresh();
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const totalAmount = currentMonth.reduce((sum, svc) => sum + svc.amountPesos, 0);

  return (
    <div className="page">
      <div className="page-header">
        <h2>🧾 Services & Bills</h2>
        <button 
          className="button button-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add Service'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <ServiceForm 
            month={month}
            onSave={handleSave}
            onCancel={() => setShowForm(false)}
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
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount (ARS)</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {currentMonth.map((svc) => (
                  <tr key={svc.id}>
                    <td>{svc.type}</td>
                    <td>{svc.description}</td>
                    <td>${svc.amountPesos.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td>{svc.dueDate}</td>
                    <td>
                      <span className={`badge badge-${svc.isPaid ? 'success' : 'warning'}`}>
                        {svc.isPaid ? 'Paid' : 'Pending'}
                      </span>
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
