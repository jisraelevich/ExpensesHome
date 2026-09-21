import React, { useState } from 'react';
import { useTable } from '../hooks';
import { CreditCard, CreditCardMonthly } from '../types';
import CreditCardBaseForm from '../components/CreditCardBaseForm';
import CreditCardMonthlyForm from '../components/CreditCardMonthlyForm';
import Modal from '../components/Modal';

interface CreditCardsPageProps {
  month: string;
  onRefresh: () => void;
}

export default function CreditCardsPage({ month, onRefresh }: CreditCardsPageProps) {
  const { items: cards, addItem: addCard } = useTable<CreditCard>('creditCards');
  const { items: monthlyData, addItem: addMonthly, updateItem: updateMonthly } =
    useTable<CreditCardMonthly>('creditCardsMonthly');
  
  const [showBaseForm, setShowBaseForm] = useState(false);
  const [editingMonthly, setEditingMonthly] = useState<CreditCardMonthly | undefined>();
  const [editingMonthlyCardId, setEditingMonthlyCardId] = useState<string | undefined>();

  // Filter active cards
  const activeCards = cards.filter((card) => card.isActive);

  // Get monthly data for each card
  const getMonthlyData = (cardId: string) => {
    return monthlyData.find((md) => md.creditCardId === cardId && md.month === month);
  };

  const handleSaveCard = async (card: CreditCard) => {
    try {
      await addCard(card);
      setShowBaseForm(false);
      onRefresh();
    } catch (error) {
      console.error('Error saving card:', error);
    }
  };

  const handleSaveMonthly = async (monthly: CreditCardMonthly) => {
    try {
      const existing = monthlyData.find((md) => md.id === monthly.id);
      if (existing) {
        await updateMonthly(monthly.id, monthly);
      } else {
        await addMonthly(monthly);
      }
      setEditingMonthly(undefined);
      setEditingMonthlyCardId(undefined);
      onRefresh();
    } catch (error) {
      console.error('Error saving monthly data:', error);
    }
  };

  // Calculate totals
  const totalPesos = activeCards.reduce((sum, card) => {
    const md = getMonthlyData(card.id);
    return sum + (md?.amountPesos || 0);
  }, 0);

  const totalDollars = activeCards.reduce((sum, card) => {
    const md = getMonthlyData(card.id);
    return sum + (md?.amountDollars || 0);
  }, 0);

  return (
    <div className="page">
      <div className="page-header">
        <h2>💳 Credit Cards</h2>
        <button
          className="button button-primary"
          onClick={() => setShowBaseForm(true)}
        >
          + Add Card
        </button>
      </div>

      {/* Add Card Modal */}
      <Modal 
        isOpen={showBaseForm} 
        title="Add New Credit Card"
        onClose={() => setShowBaseForm(false)}
        size="small"
      >
        <CreditCardBaseForm 
          onSave={handleSaveCard} 
          onCancel={() => setShowBaseForm(false)} 
        />
      </Modal>

      {/* Monthly Data Form Modal */}
      {editingMonthlyCardId && (
        <Modal
          isOpen={true}
          title={`${cards.find(c => c.id === editingMonthlyCardId)?.bankName} - ${month}`}
          onClose={() => setEditingMonthlyCardId(undefined)}
          size="small"
        >
          <CreditCardMonthlyForm
            month={month}
            creditCard={cards.find(c => c.id === editingMonthlyCardId)!}
            onSave={handleSaveMonthly}
            onCancel={() => setEditingMonthlyCardId(undefined)}
            initialData={getMonthlyData(editingMonthlyCardId)}
          />
        </Modal>
      )}

      {/* Summary */}
      {activeCards.length > 0 && (
        <div className="card" style={{ background: '#f0f9ff', borderLeft: '4px solid #667eea' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666' }}>Total (Pesos)</p>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
                ${totalPesos.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666' }}>Total (Dollars)</p>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
                ${totalDollars.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Card Grid Display */}
      {activeCards.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#999' }}>
            No active credit cards. <br />
            Go to <strong>Settings & Admin</strong> to add or activate cards.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
          {activeCards.map((card) => {
            const md = getMonthlyData(card.id);
            return (
              <div
                key={card.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  padding: '10px',
                  background: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                {/* Card Header */}
                <div>
                  <strong style={{ fontSize: '13px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.bankName}</strong>
                  <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                    {card.cardType.toUpperCase()}
                  </div>
                </div>

                {/* Card Data */}
                <div style={{ fontSize: '12px', borderTop: '1px solid #eee', paddingTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <span style={{ color: '#999', fontSize: '10px' }}>Close</span>
                    <div style={{ fontWeight: 600 }}>{md ? `Day ${md.closeDate}` : '-'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#999', fontSize: '10px' }}>Due</span>
                    <div style={{ fontWeight: 600 }}>{md ? `Day ${md.dueDate}` : '-'}</div>
                  </div>
                </div>

                {/* Amounts */}
                <div style={{ fontSize: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <span style={{ color: '#999', fontSize: '10px' }}>ARS</span>
                    <div style={{ fontWeight: 600, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>${md?.amountPesos.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '-'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#999', fontSize: '10px' }}>USD</span>
                    <div style={{ fontWeight: 600, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>${md?.amountDollars.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '-'}</div>
                  </div>
                </div>

                {/* Status */}
                <div style={{ borderTop: '1px solid #eee', paddingTop: '8px' }}>
                  {md ? (
                    <span className={`badge badge-${md.isPaid ? 'success' : 'warning'}`} style={{ fontSize: '10px' }}>
                      {md.isPaid ? 'Paid' : 'Pending'}
                    </span>
                  ) : (
                    <span style={{ fontSize: '10px', color: '#999' }}>No data</span>
                  )}
                </div>

                {/* Action Button */}
                <button
                  className="button button-primary"
                  onClick={() => setEditingMonthlyCardId(card.id)}
                  style={{ fontSize: '10px', padding: '5px 8px', marginTop: 'auto' }}
                >
                  {md ? 'Edit' : 'Add'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
