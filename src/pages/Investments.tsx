import React, { useState, useEffect } from 'react';
import { useTable } from '../hooks';
import { Investment, InvestmentMonthly } from '../types';
import Modal from '../components/Modal';
import InvestmentBaseForm from '../components/InvestmentBaseForm';
import { getCurrentDate } from '../utils/helpers';
import DataService from '../services/DataService';

interface InvestmentsPageProps {
  month: string;
  onRefresh: () => void;
}

export default function InvestmentsPage({ month, onRefresh }: InvestmentsPageProps) {
  const { items: investments, addItem: addInvestment, updateItem: updateInvestment } = useTable<Investment>('investments');
  const { items: monthlyItems, updateItem: updateMonthly, addItem: addMonthly } = useTable<InvestmentMonthly>('investmentsMonthly');
  const [showForm, setShowForm] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | undefined>();
  const [selectedMonthly, setSelectedMonthly] = useState<InvestmentMonthly | undefined>();
  const [showMonthlyModal, setShowMonthlyModal] = useState(false);

  const activeInvestments = investments.filter((inv) => inv.isActive);

  // Auto-create monthly entries for investments that don't have them
  useEffect(() => {
    const ensureMonthlyEntries = async () => {
      for (const investment of activeInvestments) {
        const existing = monthlyItems.find((mi) => mi.investmentId === investment.id && mi.month === month);
        if (!existing) {
          // Get previous month's amount if it exists
          const previousMonth = DataService.getPreviousMonth(month);
          const previousMonthly = monthlyItems.find((mi) => mi.investmentId === investment.id && mi.month === previousMonth);
          const amount = previousMonthly?.amountPerPayment || 0;

          // Calculate payment number
          const paymentNumber = DataService.calculatePaymentNumber(investment.startMonth, month);

          // Create new monthly entry
          await addMonthly({
            id: `${investment.id}-${month}`,
            investmentId: investment.id,
            month: month,
            currentPaymentNumber: paymentNumber,
            amountPerPayment: amount,
            isPaid: false,
            paidDate: undefined,
            comment: '',
          });
        }
      }
    };

    if (activeInvestments.length > 0) {
      ensureMonthlyEntries();
    }
  }, [month, activeInvestments, monthlyItems, addMonthly]);

  const getMonthlyData = (investmentId: string) => {
    return monthlyItems.find((mi) => mi.investmentId === investmentId && mi.month === month);
  };

  const handleSaveInvestment = async (investment: Investment) => {
    try {
      const existing = investments.find((inv) => inv.id === investment.id);
      if (existing) {
        await updateInvestment(investment.id, investment);
      } else {
        await addInvestment(investment);
      }
      setShowForm(false);
      setEditingInvestment(undefined);
      onRefresh();
    } catch (error) {
      console.error('Error saving investment:', error);
    }
  };

  const getCurrencySymbol = (currency: string) => currency === 'USD' ? '$' : '$';

  return (
    <div className="page">
      <div className="page-header">
        <h2>📈 Investments & Insurance</h2>
        <button
          className="button button-primary"
          onClick={() => {
            setEditingInvestment(undefined);
            setShowForm(true);
          }}
        >
          + Add Investment
        </button>
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        title={editingInvestment ? 'Edit Investment' : 'Add Investment'}
        onClose={() => {
          setShowForm(false);
          setEditingInvestment(undefined);
        }}
        size="medium"
      >
        <InvestmentBaseForm
          onSave={handleSaveInvestment}
          onCancel={() => {
            setShowForm(false);
            setEditingInvestment(undefined);
          }}
          initialData={editingInvestment}
        />
      </Modal>

      {/* Monthly Update Modal */}
      <Modal
        isOpen={showMonthlyModal && !!selectedMonthly}
        title={`Edit Payment ${selectedMonthly?.currentPaymentNumber || ''}`}
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
                  amountPerPayment: selectedMonthly.amountPerPayment,
                  comment: selectedMonthly.comment,
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
            <div>
              <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Amount *</label>
              <input
                type="text"
                inputMode="decimal"
                className="money-input"
                value={String(selectedMonthly.amountPerPayment || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/,/g, '');
                  const num = parseFloat(cleaned);
                  setSelectedMonthly({ ...selectedMonthly, amountPerPayment: isNaN(num) ? 0 : num });
                }}
                onFocus={(e) => e.target.select()}
                placeholder="0.00"
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

            <div>
              <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Comments</label>
              <textarea
                value={selectedMonthly.comment || ''}
                onChange={(e) => setSelectedMonthly({ ...selectedMonthly, comment: e.target.value })}
                onFocus={(e) => e.target.select()}
                placeholder="Optional notes"
                rows={3}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '13px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

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

      {/* Investments Cards */}
      {activeInvestments.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#999' }}>No active investments yet</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {activeInvestments.map((investment) => {
            const monthly = getMonthlyData(investment.id);
            const typeEmoji = {
              'insurance-life': '🛡️',
              'insurance-other': '🛡️',
              'investment': '📈',
              'retirement': '🏦',
              'payment-plan': '💳',
              'car': '🚗',
              'other': '📌',
            }[investment.type] || '📌';

            return (
              <div
                key={investment.id}
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
                {/* Investment Name & Type */}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{typeEmoji}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {investment.name}
                    </span>
                  </div>
                  {investment.broker && (
                    <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
                      {investment.broker}
                    </div>
                  )}
                </div>



                {/* Payment Info */}
                {monthly ? (
                  <div style={{ borderTop: '1px solid #eee', paddingTop: '8px' }}>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px' }}>
                      <strong>Payment:</strong> {monthly.currentPaymentNumber} / {investment.totalPayments}
                    </div>

                    {/* Amount (Clickable) */}
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
                      {getCurrencySymbol(investment.currency)} {monthly.amountPerPayment.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>

                    {/* Status Badge (Toggle directly) */}
                    <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                      <span
                        className={`badge badge-${monthly.isPaid ? 'success' : 'warning'}`}
                        style={{ fontSize: '10px', cursor: 'pointer' }}
                        onClick={async () => {
                          try {
                            const now = new Date().toISOString().split('T')[0];
                            await updateMonthly(monthly.id, { 
                              isPaid: !monthly.isPaid,
                              paidDate: !monthly.isPaid ? now : undefined
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

                    {/* Paid Date */}
                    {monthly.isPaid && monthly.paidDate && (
                      <div style={{ fontSize: '9px', color: '#666', textAlign: 'center', marginBottom: '4px' }}>
                        Paid on: {monthly.paidDate}
                      </div>
                    )}

                    {/* Monthly Comments */}
                    {monthly.comment && (
                      <div style={{ fontSize: '9px', color: '#999', fontStyle: 'italic', background: '#f5f5f5', padding: '4px 6px', borderRadius: '3px', borderLeft: '2px solid #999', marginBottom: '4px' }}>
                        💬 {monthly.comment}
                      </div>
                    )}

                    {/* Edit Button */}
                    <button
                      className="button button-primary"
                      onClick={() => {
                        setSelectedMonthly(monthly);
                        setShowMonthlyModal(true);
                      }}
                      style={{ fontSize: '11px', padding: '6px 8px', width: '100%', marginTop: '8px' }}
                    >
                      ✏️ Edit Amount & Comment
                    </button>
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
