import React, { useState, useEffect } from 'react';
import { useTable } from '../hooks';
import { Debt, DebtMonthly, DebtSubpayment } from '../types';
import Modal from '../components/Modal';
import { getCurrentDate } from '../utils/helpers';

interface DebtsPageProps {
  month: string;
  onRefresh: () => void;
}

export default function DebtsPage({ month, onRefresh }: DebtsPageProps) {
  const { items: debts } = useTable<Debt>('debts');
  const { items: monthlyItems, updateItem: updateMonthly, addItem: addMonthly } = useTable<DebtMonthly>('debtsMonthly');
  const { items: subpayments } = useTable<DebtSubpayment>('debtSubpayments');
  const [selectedMonthly, setSelectedMonthly] = useState<DebtMonthly | undefined>();
  const [showMonthlyModal, setShowMonthlyModal] = useState(false);

  const activeDebts = debts.filter((debt) => debt.isActive);

  // Auto-create monthly entries for debts that don't have them
  useEffect(() => {
    const ensureMonthlyEntries = async () => {
      for (const debt of activeDebts) {
        const existing = monthlyItems.find((mi) => mi.debtId === debt.id && mi.month === month);
        if (!existing) {
          const debtSubpayments = subpayments.filter((sp) => sp.debtId === debt.id);
          
          // Calculate payment number from createdAt
          const startYear = parseInt(debt.createdAt.split('-')[0]);
          const startMonthNum = parseInt(debt.createdAt.split('-')[1]);
          const currentYear = parseInt(month.split('-')[0]);
          const currentMonthNum = parseInt(month.split('-')[1]);
          const paymentNumber = (currentYear - startYear) * 12 + (currentMonthNum - startMonthNum) + 1;

          // Create sub-payment data for this month
          const monthlySubpayments = debtSubpayments
            .filter((sp) => paymentNumber >= sp.paymentNumber)
            .map((sp) => ({
              subpaymentId: sp.id,
              amount: sp.initialValue,
              isPaid: false,
            }));

          // Only create if there are sub-payments for this month
          if (monthlySubpayments.length > 0) {
            await addMonthly({
              id: `${debt.id}-${month}`,
              debtId: debt.id,
              month: month,
              currentPaymentNumber: paymentNumber,
              subpayments: monthlySubpayments,
              isPaid: false,
              paidDate: undefined,
              createdAt: getCurrentDate(),
              updatedAt: getCurrentDate(),
            });
          }
        }
      }
    };

    if (activeDebts.length > 0) {
      ensureMonthlyEntries();
    }
  }, [month, activeDebts, monthlyItems, subpayments, addMonthly]);

  const getMonthlyData = (debtId: string) => {
    return monthlyItems.find((mi) => mi.debtId === debtId && mi.month === month);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>📝 Debts</h2>
      </div>

      {/* Monthly Edit Modal */}
      <Modal
        isOpen={showMonthlyModal && !!selectedMonthly}
        title={`Edit Debt Payment #${selectedMonthly?.currentPaymentNumber || ''}`}
        onClose={() => {
          setShowMonthlyModal(false);
          setSelectedMonthly(undefined);
        }}
        size="small"
      >
        {selectedMonthly && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await updateMonthly(selectedMonthly.id, {
                  subpayments: selectedMonthly.subpayments,
                  isPaid: selectedMonthly.isPaid,
                });
                onRefresh();
                setShowMonthlyModal(false);
                setSelectedMonthly(undefined);
              } catch (error) {
                console.error('Error updating:', error);
              }
            }}
            style={{ display: 'grid', gap: '12px' }}
          >
            {selectedMonthly.subpayments.map((sp, idx) => {
              const subpayment = subpayments.find((s) => s.id === sp.subpaymentId);
              return (
                <div key={sp.subpaymentId}>
                  <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                    {subpayment?.description} *
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="money-input"
                    value={String(sp.amount || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/,/g, '');
                      const num = parseFloat(cleaned);
                      const updated = [...selectedMonthly.subpayments];
                      updated[idx].amount = isNaN(num) ? 0 : num;
                      setSelectedMonthly({ ...selectedMonthly, subpayments: updated });
                    }}
                    onFocus={(e) => e.target.select()}
                    required
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      fontSize: '13px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              );
            })}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="button button-primary" style={{ flex: 1 }}>
                Save
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  setShowMonthlyModal(false);
                  setSelectedMonthly(undefined);
                }}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Debts Cards */}
      {activeDebts.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#999' }}>No debts yet</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {activeDebts.map((debt) => {
            const monthly = getMonthlyData(debt.id);
            const debtSubpayments = subpayments.filter((sp) => sp.debtId === debt.id);
            const totalAmount = monthly?.subpayments.reduce((sum, sp) => sum + sp.amount, 0) || 0;

            return (
              <div
                key={debt.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  padding: '12px',
                  background: monthly?.isPaid ? '#f0fdf4' : '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {/* Debt Name */}
                <div style={{ fontSize: '13px', fontWeight: 600 }}>
                  📝 {debt.name}
                </div>

                {/* Payment Info */}
                {monthly ? (
                  <div style={{ borderTop: '1px solid #eee', paddingTop: '8px' }}>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px' }}>
                      <strong>Payment:</strong> #{monthly.currentPaymentNumber}
                    </div>

                    {/* Total Amount (Clickable) */}
                    <div
                      onClick={() => {
                        setSelectedMonthly(monthly);
                        setShowMonthlyModal(true);
                      }}
                      style={{
                        cursor: 'pointer',
                        padding: '8px',
                        background: '#f0f9ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#0066cc',
                        textAlign: 'center',
                        marginBottom: '6px',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = '#dbeafe';
                        (e.currentTarget as HTMLElement).style.borderColor = '#3b82f6';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = '#f0f9ff';
                        (e.currentTarget as HTMLElement).style.borderColor = '#bfdbfe';
                      }}
                    >
                      $ {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>

                    {/* Sub-payments List */}
                    <div style={{ fontSize: '9px', color: '#666', display: 'grid', gap: '4px' }}>
                      {monthly.subpayments.map((sp) => {
                        const subpayment = debtSubpayments.find((s) => s.id === sp.subpaymentId);
                        return (
                          <div key={sp.subpaymentId} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', background: '#f9f9f9', borderRadius: '3px' }}>
                            <span>{subpayment?.description}:</span>
                            <strong>${sp.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                          </div>
                        );
                      })}
                    </div>

                    {/* Status Badge */}
                    <div style={{ textAlign: 'center', marginTop: '6px' }}>
                      <span
                        className={`badge badge-${monthly.isPaid ? 'success' : 'warning'}`}
                        style={{ fontSize: '10px', cursor: 'pointer' }}
                        onClick={async () => {
                          try {
                            const now = getCurrentDate();
                            await updateMonthly(monthly.id, {
                              isPaid: !monthly.isPaid,
                              paidDate: !monthly.isPaid ? now : undefined,
                            });
                            onRefresh();
                          } catch (error) {
                            console.error('Error toggling status:', error);
                          }
                        }}
                      >
                        {monthly.isPaid ? '✓ Paid' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: '#999', textAlign: 'center', padding: '8px' }}>
                    No payment data for this month
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
