import { useState, useEffect } from 'react';
import { useTable, useAuth } from '../hooks';
import { CreditCard, Investment, Debt, DebtSubpayment, ServiceBase } from '../types';
import CreditCardBaseForm from '../components/CreditCardBaseForm';
import InvestmentBaseForm from '../components/InvestmentBaseForm';
import DebtBaseForm from '../components/DebtBaseForm';
import ServiceBaseForm from '../components/ServiceBaseForm';
import Modal from '../components/Modal';
import LoginForm from '../components/LoginForm';
import DataService from '../services/DataService';
import './admin.css';

export default function AdminPage() {
  const { items: creditCards, addItem: addCard, updateItem: updateCard } = useTable<CreditCard>('creditCards');
  const { items: investments, addItem: addInvestment, updateItem: updateInvestment } = useTable<Investment>('investments');
  const { items: debts, addItem: addDebt, updateItem: updateDebt } = useTable<Debt>('debts');
  const { items: serviceBases, addItem: addServiceBase, updateItem: updateServiceBase } = useTable<ServiceBase>('serviceBases');
  const { user } = useAuth();
  const [showCardForm, setShowCardForm] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | undefined>();
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | undefined>();
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | undefined>();
  const [editingDebtSubpayments, setEditingDebtSubpayments] = useState<DebtSubpayment[]>([]);
  const [allDebtSubpayments, setAllDebtSubpayments] = useState<DebtSubpayment[]>([]);
  const [showServiceBaseForm, setShowServiceBaseForm] = useState(false);
  const [editingServiceBase, setEditingServiceBase] = useState<ServiceBase | undefined>();

  // Load all data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await DataService.loadAllData();
        setAllDebtSubpayments(data.debtSubpayments);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [debts]); // Reload when debts change

  // Sync editing debt subpayments when the editing debt or all subpayments change
  useEffect(() => {
    if (editingDebt && allDebtSubpayments.length > 0) {
      const debtSubs = allDebtSubpayments.filter((sp: DebtSubpayment) => sp.debtId === editingDebt.id);
      setEditingDebtSubpayments(debtSubs);
    }
  }, [editingDebt, allDebtSubpayments]);

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

  const handleSaveDebt = async (debt: Debt, subpayments: DebtSubpayment[]) => {
    try {
      console.log('🔍 handleSaveDebt START - Received:', { debt, subpayments });
      
      const data = await DataService.loadAllData();
      console.log('💾 Loaded existing data:', { debtsCount: data.debts.length, subpaymentsCount: data.debtSubpayments.length });
      
      // Ensure all subpayments have the correct debtId
      const subpaymentsWithDebtId = subpayments.map((sp) => ({
        ...sp,
        debtId: debt.id,
      }));
      console.log('🔗 Set debtId for all subpayments:', subpaymentsWithDebtId);

      // Update or add the debt
      const existing = data.debts.find((d) => d.id === debt.id);
      if (existing) {
        console.log('✏️ Updating existing debt:', debt.id);
        data.debts = data.debts.map((d) => (d.id === debt.id ? debt : d));
      } else {
        console.log('✨ Adding new debt:', debt.id);
        data.debts.push(debt);
      }

      // Replace all subpayments for this debt
      const oldSubpayments = data.debtSubpayments.filter((sp) => sp.debtId === debt.id);
      console.log('🗑️ Removing old subpayments:', oldSubpayments.length, oldSubpayments);
      
      data.debtSubpayments = [
        ...data.debtSubpayments.filter((sp) => sp.debtId !== debt.id),
        ...subpaymentsWithDebtId,
      ];
      console.log('✅ Final subpayments for this debt:', data.debtSubpayments.filter((sp) => sp.debtId === debt.id));

      await DataService.saveAllData(data);
      console.log('💾 Data saved to localStorage');
      
      // Reload the subpayments in state
      setAllDebtSubpayments(data.debtSubpayments);
      
      // Close the form
      setShowDebtForm(false);
      setEditingDebt(undefined);
      setEditingDebtSubpayments([]);
      
      console.log('✅ handleSaveDebt COMPLETE');
    } catch (error) {
      console.error('❌ Error saving debt:', error);
      alert('❌ Failed to save debt: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const toggleDebtStatus = async (debt: Debt) => {
    try {
      await updateDebt(debt.id, { isActive: !debt.isActive });
    } catch (error) {
      console.error('Error toggling debt:', error);
    }
  };

  const handleDeleteDebt = async (debt: Debt) => {
    if (!window.confirm(`🗑️ Are you sure you want to permanently delete "${debt.name}"? This cannot be undone.`)) {
      return;
    }
    try {
      const data = await DataService.loadAllData();
      data.debts = data.debts.filter((d) => d.id !== debt.id);
      data.debtSubpayments = data.debtSubpayments.filter((sp) => sp.debtId !== debt.id);
      data.debtsMonthly = data.debtsMonthly.filter((dm) => dm.debtId !== debt.id);
      await DataService.saveAllData(data);
      window.location.reload();
    } catch (error) {
      console.error('Error deleting debt:', error);
      alert('❌ Failed to delete debt');
    }
  };

  const handleEditDebt = (debt: Debt) => {
    console.log('📝 handleEditDebt - Loading debt:', debt.id);
    setEditingDebt(debt);
    const debtSubs = allDebtSubpayments.filter((sp) => sp.debtId === debt.id);
    console.log('🔍 Found subpayments for debt:', debtSubs.length, debtSubs);
    setEditingDebtSubpayments(debtSubs);
    setShowDebtForm(true);
  };

  const handleSaveServiceBase = async (service: ServiceBase) => {
    try {
      const existing = serviceBases.find((s) => s.id === service.id);
      if (existing) {
        await updateServiceBase(service.id, service);
      } else {
        await addServiceBase(service);
      }
      setShowServiceBaseForm(false);
      setEditingServiceBase(undefined);
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const toggleServiceBaseStatus = async (service: ServiceBase) => {
    try {
      await updateServiceBase(service.id, { isActive: !service.isActive });
    } catch (error) {
      console.error('Error toggling service:', error);
    }
  };

  const handleDeleteServiceBase = async (service: ServiceBase) => {
    if (!window.confirm(`🗑️ Are you sure you want to permanently delete "${service.description}"? This cannot be undone.`)) {
      return;
    }
    try {
      const data = await DataService.loadAllData();
      data.serviceBases = data.serviceBases.filter((s: any) => s.id !== service.id);
      data.services = data.services.filter((s) => s.serviceBaseId !== service.id);
      await DataService.saveAllData(data);
      window.location.reload();
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('❌ Failed to delete service');
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

      {/* DEBTS MANAGEMENT */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>💳 Debts</h3>
          <button
            className="button button-primary"
            onClick={() => {
              setEditingDebt(undefined);
              setEditingDebtSubpayments([]);
              setShowDebtForm(true);
            }}
          >
            + Add Debt
          </button>
        </div>

        {debts.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center' }}>No debts yet</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
            {debts.map((debt) => {
              const debtSubs = allDebtSubpayments.filter((sp: DebtSubpayment) => sp.debtId === debt.id);
              const activeSubpayments = debtSubs.filter((sp: DebtSubpayment) => sp.isActive).length;
              const totalARS = debtSubs.reduce((sum: number, sp: DebtSubpayment) => sum + sp.amountARS, 0);

              return (
                <div
                  key={debt.id}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    padding: '12px',
                    background: debt.isActive ? '#fff' : '#f9f9f9',
                    opacity: debt.isActive ? 1 : 0.7,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '13px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {debt.name}
                    </strong>
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                      {activeSubpayments} line {activeSubpayments === 1 ? 'item' : 'items'}
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#d32f2f', borderTop: '1px solid #eee', paddingTop: '6px' }}>
                    ARS {totalARS.toLocaleString('en-US')}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '6px', borderTop: '1px solid #eee' }}>
                    <button
                      className="button button-secondary"
                      style={{ fontSize: '10px', padding: '4px 6px', flex: 1 }}
                      onClick={() => handleEditDebt(debt)}
                    >
                      Edit
                    </button>
                    <button
                      className={`button ${debt.isActive ? 'button-secondary' : 'button-primary'}`}
                      style={{ fontSize: '10px', padding: '4px 6px', flex: 1 }}
                      onClick={() => toggleDebtStatus(debt)}
                    >
                      {debt.isActive ? 'Hide' : 'Show'}
                    </button>
                    <button
                      className="button"
                      style={{ fontSize: '10px', padding: '4px 6px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                      onClick={() => handleDeleteDebt(debt)}
                      title="Permanently delete this debt"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal for Add/Edit Debt Form */}
      <Modal
        isOpen={showDebtForm}
        title={editingDebt ? 'Edit Debt' : 'Add New Debt'}
        onClose={() => {
          setShowDebtForm(false);
          setEditingDebt(undefined);
          setEditingDebtSubpayments([]);
        }}
        size="large"
      >
        <DebtBaseForm
          onSave={handleSaveDebt}
          onCancel={() => {
            setShowDebtForm(false);
            setEditingDebt(undefined);
            setEditingDebtSubpayments([]);
          }}
          initialDebt={editingDebt}
          initialSubpayments={editingDebtSubpayments}
        />
      </Modal>

      {/* SERVICE BASE FORM MODAL */}
      <Modal
        isOpen={showServiceBaseForm}
        onClose={() => {
          setShowServiceBaseForm(false);
          setEditingServiceBase(undefined);
        }}
        title={editingServiceBase ? 'Edit Service' : 'Add Recurring Service'}
      >
        <ServiceBaseForm
          onSave={handleSaveServiceBase}
          onCancel={() => {
            setShowServiceBaseForm(false);
            setEditingServiceBase(undefined);
          }}
          initialData={editingServiceBase}
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
