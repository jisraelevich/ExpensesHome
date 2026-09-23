import React, { useState } from 'react';
import { useTable, useAuth } from '../hooks';
import { CreditCard, Investment } from '../types';
import CreditCardBaseForm from '../components/CreditCardBaseForm';
import InvestmentBaseForm from '../components/InvestmentBaseForm';
import Modal from '../components/Modal';
import LoginForm from '../components/LoginForm';
import DataService from '../services/DataService';
import './admin.css';

export default function AdminPage() {
  const { items: creditCards, addItem: addCard, updateItem: updateCard } = useTable<CreditCard>('creditCards');
  const { items: investments, addItem: addInvestment, updateItem: updateInvestment } = useTable<Investment>('investments');
  const { user } = useAuth();
  const [showCardForm, setShowCardForm] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | undefined>();
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | undefined>();

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

  const handleSaveInvestment = async (investment: Investment) => {
    try {
      const existing = investments.find((inv) => inv.id === investment.id);
      if (existing) {
        await updateInvestment(investment.id, investment);
      } else {
        await addInvestment(investment);
      }
      setShowInvestmentForm(false);
      setEditingInvestment(undefined);
    } catch (error) {
      console.error('Error saving investment:', error);
    }
  };

  const toggleInvestmentStatus = async (investment: Investment) => {
    try {
      await updateInvestment(investment.id, { isActive: !investment.isActive });
    } catch (error) {
      console.error('Error toggling investment:', error);
    }
  };

  const handleDeleteCard = async (card: CreditCard) => {
    if (!window.confirm(`🗑️ Are you sure you want to permanently delete "${card.bankName}"? This cannot be undone.`)) {
      return;
    }
    try {
      const data = await DataService.loadAllData();
      data.creditCards = data.creditCards.filter((cc) => cc.id !== card.id);
      data.creditCardsMonthly = data.creditCardsMonthly.filter((ccm) => ccm.creditCardId !== card.id);
      await DataService.saveAllData(data);
      window.location.reload();
    } catch (error) {
      console.error('Error deleting card:', error);
      alert('❌ Failed to delete card');
    }
  };

  const handleDeleteInvestment = async (investment: Investment) => {
    if (!window.confirm(`🗑️ Are you sure you want to permanently delete "${investment.name}"? This cannot be undone.`)) {
      return;
    }
    try {
      const data = await DataService.loadAllData();
      data.investments = data.investments.filter((inv) => inv.id !== investment.id);
      data.investmentsMonthly = data.investmentsMonthly.filter((im) => im.investmentId !== investment.id);
      await DataService.saveAllData(data);
      window.location.reload();
    } catch (error) {
      console.error('Error deleting investment:', error);
      alert('❌ Failed to delete investment');
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
                  <button
                    className="button"
                    style={{ fontSize: '10px', padding: '4px 6px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                    onClick={() => handleDeleteCard(card)}
                    title="Permanently delete this card"
                  >
                    🗑️
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
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>📈 Investments & Insurance</h3>
          <button
            className="button button-primary"
            onClick={() => {
              setEditingInvestment(undefined);
              setShowInvestmentForm(true);
            }}
          >
            + Add Investment
          </button>
        </div>

        {investments.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center' }}>No investments yet</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
            {investments.map((investment) => (
              <div 
                key={investment.id} 
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  padding: '12px',
                  background: investment.isActive ? '#fff' : '#f9f9f9',
                  opacity: investment.isActive ? 1 : 0.7,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div>
                  <strong style={{ fontSize: '13px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {investment.name}
                  </strong>
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                    {investment.type === 'insurance-life' && '🛡️ Life Insurance'}
                    {investment.type === 'insurance-other' && '🛡️ Other Insurance'}
                    {investment.type === 'investment' && '📈 Investment'}
                    {investment.type === 'retirement' && '🏦 Retirement'}
                    {investment.type === 'payment-plan' && '💳 Payment Plan'}
                    {investment.type === 'car' && '🚗 Car'}
                    {investment.type === 'other' && '📌 Other'}
                  </div>
                </div>
                
                <div style={{ fontSize: '11px', color: '#666', borderTop: '1px solid #eee', paddingTop: '8px' }}>
                  <div><strong>Currency:</strong> {investment.currency}</div>
                  <div><strong>Payments:</strong> {investment.totalPayments}</div>
                  <div><strong>Starts:</strong> {investment.startDate}</div>
                </div>
                
                {investment.broker && (
                  <div style={{ fontSize: '10px', color: '#999', fontStyle: 'italic' }}>
                    {investment.broker}
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', paddingTop: '2px' }}>
                  <span className={`badge badge-${investment.isActive ? 'success' : 'warning'}`} style={{ fontSize: '10px' }}>
                    {investment.isActive ? 'Active' : 'Hidden'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #eee' }}>
                  <button
                    className="button button-secondary"
                    style={{ fontSize: '10px', padding: '4px 6px', flex: 1 }}
                    onClick={() => {
                      setEditingInvestment(investment);
                      setShowInvestmentForm(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className={`button ${investment.isActive ? 'button-secondary' : 'button-primary'}`}
                    style={{ fontSize: '10px', padding: '4px 6px', flex: 1 }}
                    onClick={() => toggleInvestmentStatus(investment)}
                  >
                    {investment.isActive ? 'Hide' : 'Show'}
                  </button>
                  <button
                    className="button"
                    style={{ fontSize: '10px', padding: '4px 6px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                    onClick={() => handleDeleteInvestment(investment)}
                    title="Permanently delete this investment"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Add/Edit Investment Form */}
      <Modal
        isOpen={showInvestmentForm}
        title={editingInvestment ? 'Edit Investment' : 'Add New Investment'}
        onClose={() => {
          setShowInvestmentForm(false);
          setEditingInvestment(undefined);
        }}
        size="medium"
      >
        <InvestmentBaseForm
          onSave={handleSaveInvestment}
          onCancel={() => {
            setShowInvestmentForm(false);
            setEditingInvestment(undefined);
          }}
          initialData={editingInvestment}
        />
      </Modal>

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
