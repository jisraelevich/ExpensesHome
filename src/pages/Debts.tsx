import React, { useState, useEffect } from 'react';
import { useTable } from '../hooks';
import { Debt, DebtMonthly, DebtSubpayment, DebtMonthlySubpayment } from '../types';
import Modal from '../components/Modal';
import { getCurrentDate } from '../utils/helpers';
import DataService from '../services/DataService';

interface DebtsPageProps {
  month: string;
  onRefresh: () => void;
}

export default function DebtsPage({ month, onRefresh }: DebtsPageProps) {
  const { items: debts } = useTable<Debt>('debts');
  const { items: debtsMonthly, updateItem: updateMonthly, addItem: addMonthly } = useTable<DebtMonthly>('debtsMonthly');
  const { items: subpayments } = useTable<DebtSubpayment>('debtSubpayments');
  const [selectedMonthly, setSelectedMonthly] = useState<DebtMonthly | undefined>();
  const [showMonthlyModal, setShowMonthlyModal] = useState(false);
  const [copyPreviewMessage, setCopyPreviewMessage] = useState('');
  const [showCopyPreview, setShowCopyPreview] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const activeDebts = debts.filter((debt) => debt.isActive);

  // Auto-create monthly entries for debts with visibility filtering
  useEffect(() => {
    const ensureMonthlyEntries = async () => {
      for (const debt of activeDebts) {
        const existing = debtsMonthly.find((dm) => dm.debtId === debt.id && dm.month === month);
        if (!existing) {
          const visibleSubpayments = await DataService.getVisibleSubpaymentsForMonth(debt.id, month);
          
          if (visibleSubpayments.length > 0) {
            const monthlySubpayments: DebtMonthlySubpayment[] = visibleSubpayments.map((sp) => ({
              subpaymentId: sp.id,
              description: sp.description,
              amountARS: sp.amountARS,
              amountUSD: sp.amountUSD,
              isPaid: false,
            }));

            await addMonthly({
              id: `${debt.id}-${month}`,
              debtId: debt.id,
              month: month,
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
  }, [month, activeDebts, debtsMonthly, subpayments, addMonthly]);

  const getMonthlyData = (debtId: string) => {
    return debtsMonthly.find((dm) => dm.debtId === debtId && dm.month === month);
  };

  // Get current description from subpayment definition (not cached version)
  const getSubpaymentDescription = (subpaymentId: string): string => {
    return subpayments.find((s) => s.id === subpaymentId)?.description || 'Unknown';
  };

  // Copy to clipboard - shows preview first
  const handleShowCopyPreview = (debt: Debt, monthly: DebtMonthly | undefined) => {
    if (!monthly) return;

    // Only include visible subpayments in the message
    const visibleSubpayments = monthly.subpayments.filter((sp) => {
      const subpaymentDef = subpayments.find((s) => s.id === sp.subpaymentId);
      return subpaymentDef && DataService.isSubpaymentVisibleInMonth(subpaymentDef, month);
    });

    const totalARS = visibleSubpayments.reduce((sum, sp) => sum + sp.amountARS, 0);
    const totalUSD = visibleSubpayments.reduce((sum, sp) => sum + sp.amountUSD, 0);

    let message = `💳 *${debt.name}*\n\n`;
    message += `📅 ${month}\n`;
    message += `━━━━━━━━━━━━━━━━\n\n`;

    visibleSubpayments.forEach((sp) => {
      const subpaymentDef = subpayments.find((s) => s.id === sp.subpaymentId);
      const currentDescription = getSubpaymentDescription(sp.subpaymentId);
      const paymentNum = subpaymentDef ? DataService.getPaymentNumber(subpaymentDef, month) : { current: 1, total: 0 };
      const paymentLabel =
        paymentNum.total === 0
          ? '(permanent)'
          : paymentNum.total === 1
            ? '(this month only)'
            : `(${paymentNum.current}/${paymentNum.total})`;

      message += `• ${currentDescription} ${paymentLabel}\n`;
      message += `  ARS: $${sp.amountARS.toLocaleString('en-US')}\n`;
      message += `  USD: $${sp.amountUSD.toFixed(2)}\n\n`;
    });

    message += `━━━━━━━━━━━━━━━━\n`;
    message += `*Total ARS:* $${totalARS.toLocaleString('en-US')}\n`;
    message += `*Total USD:* $${totalUSD.toFixed(2)}\n`;
    message += `\n${monthly.isPaid ? '✅ PAID' : '⏳ PENDING'}`;

    setCopyPreviewMessage(message);
    setShowCopyPreview(true);
  };

  const doCopyToClipboard = () => {
    navigator.clipboard.writeText(copyPreviewMessage).then(() => {
      setCopySuccess(true);
      setTimeout(() => {
        setCopySuccess(false);
        setShowCopyPreview(false);
      }, 1500);
    }).catch(() => {
      alert('❌ Failed to copy to clipboard');
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>📝 Debts</h2>
      </div>

      {/* Monthly Edit Modal */}
      <Modal
        isOpen={showMonthlyModal && !!selectedMonthly}
        title={selectedMonthly ? `Edit Debt - ${debts.find((d) => d.id === selectedMonthly.debtId)?.name || 'Unknown'} (${month})` : 'Edit Debt'}
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
              const subpaymentDef = subpayments.find((s) => s.id === sp.subpaymentId);
              const paymentNum = subpaymentDef ? DataService.getPaymentNumber(subpaymentDef, month) : { current: 1, total: 0 };
              const paymentLabel =
                paymentNum.total === 0
                  ? '(permanent)'
                  : paymentNum.total === 1
                    ? '(this month only)'
                    : `(${paymentNum.current}/${paymentNum.total})`;

              return (
                <div key={sp.subpaymentId}>
                  <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', fontWeight: 'bold', color: '#333' }}>
                    {getSubpaymentDescription(sp.subpaymentId)} <span style={{ color: '#999' }}>{paymentLabel}</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <div>
                      <small style={{ color: '#666' }}>ARS</small>
                      <input
                        type="number"
                        className="money-input"
                        value={sp.amountARS || ''}
                        onChange={(e) => {
                          const updated = [...selectedMonthly.subpayments];
                          updated[idx].amountARS = parseFloat(e.target.value) || 0;
                          setSelectedMonthly({ ...selectedMonthly, subpayments: updated });
                        }}
                        onFocus={(e) => e.target.select()}
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
                      <small style={{ color: '#666' }}>USD</small>
                      <input
                        type="number"
                        step="0.01"
                        className="money-input"
                        value={sp.amountUSD || ''}
                        onChange={(e) => {
                          const updated = [...selectedMonthly.subpayments];
                          updated[idx].amountUSD = parseFloat(e.target.value) || 0;
                          setSelectedMonthly({ ...selectedMonthly, subpayments: updated });
                        }}
                        onFocus={(e) => e.target.select()}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          fontSize: '13px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                  </div>
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

      {/* Copy Preview Modal */}
      <Modal
        isOpen={showCopyPreview}
        title="📋 Review Message"
        onClose={() => setShowCopyPreview(false)}
        size="small"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Preview Box */}
          <div
            style={{
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '6px',
              padding: '12px',
              fontFamily: 'monospace',
              fontSize: '12px',
              lineHeight: '1.6',
              maxHeight: '300px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {copyPreviewMessage}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowCopyPreview(false)}
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                backgroundColor: '#ccc',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={doCopyToClipboard}
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                backgroundColor: copySuccess ? '#4CAF50' : '#25D366',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'background-color 0.3s',
              }}
            >
              {copySuccess ? '✅ Copied!' : '📋 Copy to Clipboard'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Debts Cards */}
      {activeDebts.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#999' }}>No debts yet. Go to Admin to add one.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
          {activeDebts.map((debt) => {
            const monthly = getMonthlyData(debt.id);
            // Only calculate totals for visible subpayments
            const visibleSubpayments = monthly?.subpayments.filter((sp) => {
              const subpaymentDef = subpayments.find((s) => s.id === sp.subpaymentId);
              return subpaymentDef && DataService.isSubpaymentVisibleInMonth(subpaymentDef, month);
            }) || [];
            const totalARS = visibleSubpayments.reduce((sum, sp) => sum + sp.amountARS, 0);
            const totalUSD = visibleSubpayments.reduce((sum, sp) => sum + sp.amountUSD, 0);

            return (
              <div
                key={debt.id}
                style={{
                  border: monthly?.isPaid ? '2px solid #4CAF50' : '1px solid #ddd',
                  borderRadius: '6px',
                  padding: '12px',
                  background: monthly?.isPaid ? '#f0fdf4' : '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {/* Debt Name */}
                <div style={{ fontSize: '14px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>💳 {debt.name}</span>
                  {monthly?.isPaid && <span style={{ fontSize: '12px', color: '#4CAF50' }}>✓ PAID</span>}
                </div>

                {/* Payment Info */}
                {monthly ? (
                  <div style={{ borderTop: '1px solid #eee', paddingTop: '8px' }}>
                    {/* Total Amount (Clickable) */}
                    <div
                      onClick={() => {
                        setSelectedMonthly(monthly);
                        setShowMonthlyModal(true);
                      }}
                      style={{
                        cursor: 'pointer',
                        padding: '10px',
                        background: '#f0f9ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#0066cc',
                        textAlign: 'center',
                        marginBottom: '8px',
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
                      ARS ${totalARS.toLocaleString('en-US')} | USD ${totalUSD.toFixed(2)}
                    </div>

                    {/* Sub-payments List */}
                    <div style={{ fontSize: '11px', color: '#666', display: 'grid', gap: '6px', marginBottom: '8px' }}>
                      {monthly.subpayments
                        .filter((sp) => {
                          // Only show subpayments that are still visible
                          const subpaymentDef = subpayments.find((s) => s.id === sp.subpaymentId);
                          if (!subpaymentDef) return false;
                          // Check if this subpayment should be visible in this month
                          return DataService.isSubpaymentVisibleInMonth(subpaymentDef, month);
                        })
                        .map((sp) => {
                          const subpaymentDef = subpayments.find((s) => s.id === sp.subpaymentId);
                          const paymentNum = subpaymentDef ? DataService.getPaymentNumber(subpaymentDef, month) : { current: 1, total: 0 };
                          const paymentLabel =
                            paymentNum.total === 0
                              ? '(permanent)'
                              : paymentNum.total === 1
                                ? '(this month only)'
                                : `(${paymentNum.current}/${paymentNum.total})`;

                          return (
                            <div
                              key={sp.subpaymentId}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '6px',
                                background: '#f9f9f9',
                                borderRadius: '3px',
                              }}
                            >
                              <span>
                                {getSubpaymentDescription(sp.subpaymentId)} <span style={{ color: '#999' }}>{paymentLabel}</span>
                              </span>
                              <span style={{ fontWeight: 600 }}>
                                ${sp.amountARS.toLocaleString('en-US')} / ${sp.amountUSD.toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleShowCopyPreview(debt, monthly)}
                        style={{
                          flex: 1,
                          padding: '6px',
                          fontSize: '11px',
                          backgroundColor: '#25D366',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                        }}
                      >
                        📋 Copy to clipboard
                      </button>
                      <button
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
                        style={{
                          flex: 1,
                          padding: '6px',
                          fontSize: '11px',
                          backgroundColor: monthly.isPaid ? '#ff9800' : '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                        }}
                      >
                        {monthly.isPaid ? '↩️ Undo' : '✓ Mark Paid'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: '#999', textAlign: 'center', padding: '8px', fontStyle: 'italic' }}>
                    No active items for this month
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
