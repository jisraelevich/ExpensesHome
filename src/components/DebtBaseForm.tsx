import { useState } from 'react';
import { Debt, DebtSubpayment } from '../types';
import { generateId, getCurrentDate } from '../utils/helpers';
import './forms.css';

interface DebtBaseFormProps {
  onSave: (debt: Debt, subpayments: DebtSubpayment[]) => void;
  onCancel: () => void;
  initialDebt?: Debt;
  initialSubpayments?: DebtSubpayment[];
}

export default function DebtBaseForm({
  onSave,
  onCancel,
  initialDebt,
  initialSubpayments = [],
}: DebtBaseFormProps) {
  const [debtName, setDebtName] = useState(initialDebt?.name || '');
  const [subpayments, setSubpayments] = useState<DebtSubpayment[]>(initialSubpayments);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Partial<DebtSubpayment>>({});
  const [newSubpayment, setNewSubpayment] = useState({
    description: '',
    startDate: getCurrentDate().split('T')[0],
    amountARS: 0,
    amountUSD: 0,
    totalPayments: 0,
  });

  const handleAddSubpayment = () => {
    if (!newSubpayment.description.trim()) {
      alert('❌ Description is required');
      return;
    }

    // Verify we don't have duplicate descriptions for the same debt
    if (subpayments.some((sp) => sp.description === newSubpayment.description.trim())) {
      alert('⚠️ A line item with this description already exists');
      return;
    }

    const subpayment: DebtSubpayment = {
      id: generateId(),
      debtId: initialDebt?.id || '', // Will be set when debt is created
      description: newSubpayment.description.trim(),
      startDate: newSubpayment.startDate,
      amountARS: newSubpayment.amountARS ?? 0,
      amountUSD: newSubpayment.amountUSD ?? 0,
      totalPayments: newSubpayment.totalPayments ?? 0,
      isActive: true,
      createdAt: getCurrentDate(),
      updatedAt: getCurrentDate(),
    };

    setSubpayments([...subpayments, subpayment]);
    
    // Reset form
    setNewSubpayment({
      description: '',
      startDate: getCurrentDate().split('T')[0],
      amountARS: 0,
      amountUSD: 0,
      totalPayments: 0,
    });
  };

  const handleRemoveSubpayment = (index: number) => {
    setSubpayments(subpayments.filter((_, i) => i !== index));
  };

  const handleToggleSubpaymentActive = (index: number) => {
    const updated = [...subpayments];
    updated[index].isActive = !updated[index].isActive;
    setSubpayments(updated);
  };

  const handleEditSubpayment = (index: number) => {
    setEditingIndex(index);
    setEditingData({ ...subpayments[index] });
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;

    if (!editingData.description?.trim()) {
      alert('❌ Description is required');
      return;
    }

    const updated = [...subpayments];
    updated[editingIndex] = {
      ...updated[editingIndex],
      description: editingData.description?.trim() || updated[editingIndex].description,
      startDate: editingData.startDate || updated[editingIndex].startDate,
      amountARS: (editingData.amountARS ?? updated[editingIndex].amountARS) ?? 0,
      amountUSD: (editingData.amountUSD ?? updated[editingIndex].amountUSD) ?? 0,
      totalPayments: (editingData.totalPayments ?? updated[editingIndex].totalPayments) ?? 0,
      updatedAt: getCurrentDate(),
    };
    setSubpayments(updated);
    setEditingIndex(null);
    setEditingData({});
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingData({});
  };

  const handleSave = () => {
    // Validate debt name
    if (!debtName.trim()) {
      alert('❌ Debt name is required');
      return;
    }

    // Validate at least one line item
    if (subpayments.length === 0) {
      alert('❌ Add at least one line item before saving');
      return;
    }

    // Validate all subpayments have amounts
    if (subpayments.some((sp) => sp.amountARS === 0 && sp.amountUSD === 0)) {
      alert('⚠️ All line items must have at least one amount (ARS or USD)');
      return;
    }

    const debt: Debt = {
      id: initialDebt?.id || generateId(),
      name: debtName.trim(),
      isActive: initialDebt?.isActive ?? true,
      createdAt: initialDebt?.createdAt || getCurrentDate(),
      updatedAt: getCurrentDate(),
    };

    // Update debtId for all subpayments and ensure 0 defaults
    const updatedSubpayments = subpayments.map((sp) => ({
      ...sp,
      debtId: debt.id,
      amountARS: sp.amountARS ?? 0,
      amountUSD: sp.amountUSD ?? 0,
      totalPayments: sp.totalPayments ?? 0,
    }));

    console.log('🔍 DebtBaseForm.handleSave calling onSave:', { debtId: debt.id, debtName: debt.name, subpaymentCount: updatedSubpayments.length, updatedSubpayments });
    onSave(debt, updatedSubpayments);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Debt Header */}
      <div>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
          Debt Name / Description
        </label>
        <input
          type="text"
          value={debtName}
          onChange={(e) => setDebtName(e.target.value)}
          placeholder="e.g., Personal Loan - Bank A"
          style={{
            width: '100%',
            padding: '8px',
            fontSize: '14px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Line Items Table */}
      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
          Invoice Line Items
        </label>

        {subpayments.length > 0 && (
          <div
            style={{
              marginBottom: '12px',
              borderRadius: '6px',
              overflow: 'hidden',
              border: '1px solid #ddd',
              fontSize: '12px',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 80px 80px 80px 60px 100px',
                gap: '8px',
                padding: '8px',
                backgroundColor: '#f5f5f5',
                fontWeight: 'bold',
                borderBottom: '1px solid #ddd',
              }}
            >
              <div>Description</div>
              <div>Start Date</div>
              <div>Amount ARS</div>
              <div>Amount USD</div>
              <div>Months (0=∞)</div>
              <div>Active</div>
              <div>Actions</div>
            </div>

            {subpayments.map((sp, index) => (
              <div
                key={index}
                style={{
                  display: 'grid',
                  gridTemplateColumns: editingIndex === index ? '1fr 1fr 80px 80px 80px 60px 100px' : '1fr 1fr 80px 80px 80px 60px 40px',
                  gap: '8px',
                  padding: '8px',
                  borderBottom: '1px solid #eee',
                  alignItems: 'center',
                  backgroundColor: editingIndex === index ? '#fff9e6' : sp.isActive ? '#fff' : '#f9f9f9',
                  opacity: sp.isActive ? 1 : 0.6,
                }}
              >
                {editingIndex === index ? (
                  <>
                    <input
                      type="text"
                      value={editingData.description || ''}
                      onChange={(e) => setEditingData({ ...editingData, description: e.target.value })}
                      style={{
                        padding: '6px',
                        fontSize: '12px',
                        border: '1px solid #2196F3',
                        borderRadius: '4px',
                        boxSizing: 'border-box',
                      }}
                    />
                    <input
                      type="date"
                      value={editingData.startDate || ''}
                      onChange={(e) => setEditingData({ ...editingData, startDate: e.target.value })}
                      style={{
                        padding: '6px',
                        fontSize: '12px',
                        border: '1px solid #2196F3',
                        borderRadius: '4px',
                        boxSizing: 'border-box',
                      }}
                    />
                    <input
                      type="number"
                      value={editingData.amountARS || ''}
                      onChange={(e) => setEditingData({ ...editingData, amountARS: parseFloat(e.target.value) || 0 })}
                      className="money-input"
                      style={{
                        padding: '6px',
                        fontSize: '12px',
                        border: '1px solid #2196F3',
                        borderRadius: '4px',
                        boxSizing: 'border-box',
                      }}
                    />
                    <input
                      type="number"
                      value={editingData.amountUSD || ''}
                      onChange={(e) => setEditingData({ ...editingData, amountUSD: parseFloat(e.target.value) || 0 })}
                      className="money-input"
                      style={{
                        padding: '6px',
                        fontSize: '12px',
                        border: '1px solid #2196F3',
                        borderRadius: '4px',
                        boxSizing: 'border-box',
                      }}
                    />
                    <input
                      type="number"
                      value={editingData.totalPayments || ''}
                      onChange={(e) => setEditingData({ ...editingData, totalPayments: parseInt(e.target.value) || 0 })}
                      style={{
                        padding: '6px',
                        fontSize: '12px',
                        border: '1px solid #2196F3',
                        borderRadius: '4px',
                        boxSizing: 'border-box',
                      }}
                    />
                    <div>
                      <button
                        onClick={() => handleToggleSubpaymentActive(index)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '10px',
                          backgroundColor: sp.isActive ? '#4CAF50' : '#ccc',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                        }}
                      >
                        {sp.isActive ? '✓' : '✗'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={handleSaveEdit}
                        style={{
                          padding: '4px 6px',
                          fontSize: '11px',
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          flex: 1,
                        }}
                      >
                        ✓
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        style={{
                          padding: '4px 6px',
                          fontSize: '11px',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          flex: 1,
                        }}
                      >
                        ✗
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>{sp.description}</div>
                    <div>{sp.startDate}</div>
                    <div>{sp.amountARS.toLocaleString('en-US')}</div>
                    <div>${sp.amountUSD.toFixed(2)}</div>
                    <div>{sp.totalPayments}</div>
                    <div>
                      <button
                        onClick={() => handleToggleSubpaymentActive(index)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '10px',
                          backgroundColor: sp.isActive ? '#4CAF50' : '#ccc',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                        }}
                      >
                        {sp.isActive ? '✓' : '✗'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => handleEditSubpayment(index)}
                        style={{
                          padding: '4px 6px',
                          fontSize: '11px',
                          backgroundColor: '#2196F3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          flex: 1,
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleRemoveSubpayment(index)}
                        style={{
                          padding: '4px 6px',
                          fontSize: '11px',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          flex: 1,
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add New Line Item */}
        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: '6px',
            padding: '12px',
            backgroundColor: '#fafafa',
          }}
        >
          <div style={{ marginBottom: '12px', fontSize: '11px', fontWeight: 'bold', color: '#666' }}>
            Add New Line Item
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 80px 80px 80px',
              gap: '8px',
              marginBottom: '8px',
            }}
          >
            <input
              type="text"
              placeholder="Description (Principal, Interest, Fee...)"
              value={newSubpayment.description}
              onChange={(e) => setNewSubpayment({ ...newSubpayment, description: e.target.value })}
              style={{
                padding: '6px',
                fontSize: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box',
              }}
            />
            <input
              type="date"
              value={newSubpayment.startDate}
              onChange={(e) => setNewSubpayment({ ...newSubpayment, startDate: e.target.value })}
              style={{
                padding: '6px',
                fontSize: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box',
              }}
            />
            <input
              type="number"
              placeholder="ARS"
              value={newSubpayment.amountARS || ''}
              onChange={(e) => setNewSubpayment({ ...newSubpayment, amountARS: parseFloat(e.target.value) || 0 })}
              className="money-input"
            />
            <input
              type="number"
              placeholder="USD"
              value={newSubpayment.amountUSD || ''}
              onChange={(e) => setNewSubpayment({ ...newSubpayment, amountUSD: parseFloat(e.target.value) || 0 })}
              className="money-input"
            />
            <input
              type="number"
              placeholder="Months (0=∞)"
              value={newSubpayment.totalPayments}
              onChange={(e) => setNewSubpayment({ ...newSubpayment, totalPayments: parseInt(e.target.value) || 0 })}
              className="integer-input"
              style={{
                padding: '6px',
                fontSize: '12px',
              }}
            />
          </div>

          <button
            onClick={handleAddSubpayment}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '12px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            + Add Line Item
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '10px 16px',
            fontSize: '14px',
            backgroundColor: '#ccc',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          style={{
            padding: '10px 16px',
            fontSize: '14px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          💾 Save
        </button>
      </div>
    </div>
  );
}
