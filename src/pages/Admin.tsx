import React, { useState } from 'react';
import { useTable, useAuth } from '../hooks';
import { CreditCard, Investment } from '../types';
import CreditCardBaseForm from '../components/CreditCardBaseForm';
import Modal from '../components/Modal';
import LoginForm from '../components/LoginForm';
import './admin.css';

export default function AdminPage() {
  const { items: creditCards, addItem: addCard, updateItem: updateCard } = useTable<CreditCard>('creditCards');
  const { items: investments } = useTable<Investment>('investments');
  const { user } = useAuth();
  const [showCardForm, setShowCardForm] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | undefined>();

  const handleSaveCard = async (card: CreditCard) => {
    try {
      const existing = creditCards.find((cc) => cc.id === card.id);
      if (existing) {
        await updateCard(card.id, card);
      } else {
        await addCard(card);
      }
      setShowCardForm(false);
      setEditingCard(undefined);
    } catch (error) {
      console.error('Error saving card:', error);
    }
  };

  const toggleCardStatus = async (card: CreditCard) => {
    try {
      await updateCard(card.id, { isActive: !card.isActive });
    } catch (error) {
      console.error('Error toggling card:', error);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>⚙️ Settings & Admin</h2>
      </div>

      {/* USER / AUTH */}
      <div className="card">
        <div className="card-header">
          <h3>👤 User Account</h3>
        </div>
        <LoginForm />
      </div>

      {/* CREDIT CARDS MANAGEMENT */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>💳 Credit Cards</h3>
          <button
            className="button button-primary"
            onClick={() => {
              setEditingCard(undefined);
              setShowCardForm(true);
            }}
          >
            + Add Card
          </button>
        </div>

        {creditCards.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center' }}>No credit cards yet</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
            {creditCards.map((card) => (
              <div 
                key={card.id} 
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  padding: '10px',
                  background: card.isActive ? '#fff' : '#f9f9f9',
                  opacity: card.isActive ? 1 : 0.7,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div>
                  <strong style={{ fontSize: '13px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.bankName}</strong>
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                    {card.cardType.toUpperCase()}
                  </div>
                </div>
                
                {card.notes && (
                  <div style={{ fontSize: '10px', color: '#999', fontStyle: 'italic', borderTop: '1px solid #eee', paddingTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {card.notes}
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', paddingTop: '2px' }}>
                  <span className={`badge badge-${card.isActive ? 'success' : 'warning'}`} style={{ fontSize: '10px' }}>
                    {card.isActive ? 'Active' : 'Hidden'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '6px', borderTop: '1px solid #eee' }}>
                  <button
                    className="button button-secondary"
                    style={{ fontSize: '10px', padding: '4px 6px', flex: 1 }}
                    onClick={() => {
                      setEditingCard(card);
                      setShowCardForm(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className={`button ${card.isActive ? 'button-secondary' : 'button-primary'}`}
                    style={{ fontSize: '10px', padding: '4px 6px', flex: 1 }}
                    onClick={() => toggleCardStatus(card)}
                  >
                    {card.isActive ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Add/Edit Card Form */}
      <Modal
        isOpen={showCardForm}
        title={editingCard ? 'Edit Credit Card' : 'Add New Credit Card'}
        onClose={() => {
          setShowCardForm(false);
          setEditingCard(undefined);
        }}
        size="small"
      >
        <CreditCardBaseForm
          onSave={handleSaveCard}
          onCancel={() => {
            setShowCardForm(false);
            setEditingCard(undefined);
          }}
          initialData={editingCard}
        />
      </Modal>

      {/* INVESTMENTS MANAGEMENT */}
      <div className="card">
        <div className="card-header">
          <h3>📈 Investments</h3>
          <small style={{ color: '#999' }}>Coming soon</small>
        </div>
        <p style={{ color: '#999', textAlign: 'center' }}>Investment management interface coming soon...</p>
      </div>

      {/* APP INFO */}
      <div className="card">
        <h3>ℹ️ App Information</h3>
        <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.8' }}>
          <p>
            <strong>App:</strong> Expense Home - Monthly Finance Manager
          </p>
          <p>
            <strong>Version:</strong> 1.0.0
          </p>
          <p>
            <strong>Data Storage:</strong> Local Browser (localStorage)
          </p>
          <p>
            <strong>Last Updated:</strong> {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
