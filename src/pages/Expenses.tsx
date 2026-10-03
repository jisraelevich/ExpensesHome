import React, { useState, useEffect } from 'react';
import { useTable, useAppData } from '../hooks';
import { Expense, CreditCardMonthly, DebtMonthly, Debt } from '../types';
import ExpenseForm from '../components/ExpenseForm';
import { parseMoneyInput, formatMoneyInput, generateId } from '../utils/helpers';

interface ExpensesPageProps {
  month: string;
  onRefresh: () => void;
}

export default function ExpensesPage({ month, onRefresh }: ExpensesPageProps) {
  const { items, addItem, updateItem } = useTable<Expense>('expenses');
  const { data } = useAppData();
  const [showForm, setShowForm] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | undefined>();
  
  // Auto-populate expenses from credit cards and debts for current month
  useEffect(() => {
    const syncToExpenses = async () => {
      if (!data?.creditCardsMonthly && !data?.debtsMonthly) return;
      
      // Sync credit cards
      const ccForMonth = data.creditCardsMonthly?.filter(
        (cc: CreditCardMonthly) => 
          cc.month === month && 
          (cc.amountPesos > 0 || cc.amountDollars > 0)
      ) || [];
      
      for (const cc of ccForMonth) {
        const ccCard = data.creditCards?.find(c => c.id === cc.creditCardId);
        if (!ccCard) continue;
        
        const existingExpense = items.find(exp => exp.description === ccCard.bankName && exp.month === month && exp.isFromRule);
        
        if (!existingExpense) {
          const newExpense: Expense = {
            id: generateId(),
            description: ccCard.bankName,
            amountPesos: cc.amountPesos,
            amountDollars: cc.amountDollars,
            category: 'Credit Card',
            status: 'now',
            fromCreditCard: true,
            month,
            isFromRule: true,
            notes: `Auto-generated from ${ccCard.bankName} (${ccCard.cardType.toUpperCase()})`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await addItem(newExpense);
        }
      }
      
      // Sync debts marked as expenses
      const debtsForMonth = data.debtsMonthly?.filter(
        (dm: DebtMonthly) => dm.month === month
      ) || [];
      
      for (const dm of debtsForMonth) {
        const debt = data.debts?.find((d: Debt) => d.id === dm.debtId);
        if (!debt || !debt.isExpense) continue;
        
        const totalAmount = dm.subpayments?.reduce((sum: number, sp: any) => sum + sp.amountARS, 0) || 0;
        const totalUSD = dm.subpayments?.reduce((sum: number, sp: any) => sum + sp.amountUSD, 0) || 0;
        
        if (totalAmount > 0 || totalUSD > 0) {
          const existingExpense = items.find(exp => exp.description === debt.name && exp.month === month && exp.isFromRule);
          
          if (!existingExpense) {
            const newExpense: Expense = {
              id: generateId(),
              description: debt.name,
              amountPesos: totalAmount,
              amountDollars: totalUSD,
              category: 'Debts',
              status: 'now',
              fromCreditCard: false,
              month,
              isFromRule: true,
              notes: `Auto-generated from ${debt.name}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await addItem(newExpense);
          }
        }
      }
    };
    
    syncToExpenses();
  }, [month, data]);
  
  const currentMonth = items.filter((exp) => exp.month === month);
  
  // Separate rule-based and manual expenses
  const ruleBasedExpenses = currentMonth.filter(exp => exp.isFromRule);
  const manualExpenses = currentMonth.filter(exp => !exp.isFromRule);
  
  // Group manual expenses by category
  const groupedManualExpenses = manualExpenses.reduce((groups: Record<string, Expense[]>, exp) => {
    const category = exp.category || 'Uncategorized';
    if (!groups[category]) groups[category] = [];
    groups[category].push(exp);
    return groups;
  }, {});
  
  // Group rule-based by category
  const groupedRuleExpenses = ruleBasedExpenses.reduce((groups: Record<string, Expense[]>, exp) => {
    const category = exp.category || 'Uncategorized';
    if (!groups[category]) groups[category] = [];
    groups[category].push(exp);
    return groups;
  }, {});
  
  // All categories in order: rules first, then manual
  const allCategories = [...Object.keys(groupedRuleExpenses), ...Object.keys(groupedManualExpenses)];

  // Get latest dollar rate for currency conversion
  const latestRate = data?.dollarRates && data.dollarRates.length > 0
    ? data.dollarRates[data.dollarRates.length - 1].realValue
    : 200;

  const statusColors: Record<string, string> = {
    done: 'success',
    now: 'warning',
    later: 'info',
  };

  const handleSave = async (expense: Expense) => {
    try {
      const existing = items.find((exp) => exp.id === expense.id);
      if (existing) {
        await updateItem(expense.id, expense);
      } else {
        await addItem(expense);
      }
      setShowForm(false);
      setSelectedExpense(undefined);
      onRefresh();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const handleEditDescription = async (expenseId: string, newDescription: string) => {
    const expense = currentMonth.find((e) => e.id === expenseId);
    if (expense) {
      await updateItem(expenseId, { description: newDescription });
      onRefresh();
    }
  };

  const handleEditAmountPesos = async (expenseId: string, newAmount: number) => {
    const expense = currentMonth.find((e) => e.id === expenseId);
    if (expense) {
      await updateItem(expenseId, { amountPesos: newAmount });
      onRefresh();
    }
  };

  const handleEditAmountDollars = async (expenseId: string, newAmount: number) => {
    const expense = currentMonth.find((e) => e.id === expenseId);
    if (expense) {
      await updateItem(expenseId, { amountDollars: newAmount });
      onRefresh();
    }
  };

  const handleEditCategory = async (expenseId: string, newCategory: string) => {
    const expense = currentMonth.find((e) => e.id === expenseId);
    if (expense) {
      await updateItem(expenseId, { category: newCategory || undefined });
      onRefresh();
    }
  };

  const handleEditStatus = async (expenseId: string, newStatus: 'done' | 'now' | 'later') => {
    const expense = currentMonth.find((e) => e.id === expenseId);
    if (expense) {
      await updateItem(expenseId, { status: newStatus });
      onRefresh();
    }
  };

  const handleEditFromCreditCard = async (expenseId: string, fromCreditCard: boolean) => {
    const expense = currentMonth.find((e) => e.id === expenseId);
    if (expense) {
      await updateItem(expenseId, { fromCreditCard });
      onRefresh();
    }
  };

  const totalPesos = currentMonth.reduce((sum, exp) => sum + exp.amountPesos, 0);
  const totalDollars = currentMonth.reduce((sum, exp) => sum + exp.amountDollars, 0);

  return (
    <div className="page">
      <div className="page-header">
        <h2>💰 Expenses</h2>
        <button 
          className="button button-primary"
          onClick={() => {
            setSelectedExpense(undefined);
            setShowForm(!showForm);
          }}
        >
          {showForm ? 'Cancel' : '+ Add Expense'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <ExpenseForm 
            month={month}
            dollarRate={latestRate}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setSelectedExpense(undefined);
            }}
            initialData={selectedExpense}
          />
        </div>
      )}

      {currentMonth.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#999' }}>No expenses for this month</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="card">
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

          {/* List */}
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount (ARS)</th>
                  <th>Amount (USD)</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>From CC</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allCategories.map((category) => {
                  const isRuleCategory = groupedRuleExpenses[category];
                  const expenses = isRuleCategory ? groupedRuleExpenses[category] : groupedManualExpenses[category];
                  
                  return (
                    <React.Fragment key={category}>
                      {/* Category Header */}
                      <tr style={{ backgroundColor: isRuleCategory ? '#fffacd' : '#f9f9f9', fontWeight: 'bold' }}>
                        <td colSpan={7} style={{ paddingTop: '12px', paddingBottom: '6px' }}>
                          {category === 'Credit Card' && '💳 Credit Cards'}
                          {category === 'Debts' && '💰 Debts'}
                          {category !== 'Credit Card' && category !== 'Debts' && `📁 ${category}`}
                          {isRuleCategory && ' (Auto-synced)'}
                        </td>
                      </tr>
                      {/* Expenses under category */}
                      {expenses.map((exp) => (
                        <tr key={exp.id} style={{ backgroundColor: exp.isFromRule ? '#f5f5f5' : 'transparent' }}>
                          <td>
                            <input
                              type="text"
                              disabled={exp.isFromRule}
                              style={{
                                width: '100%',
                                padding: '4px',
                                border: exp.isFromRule ? 'none' : '1px solid #ccc',
                                borderRadius: '4px',
                                backgroundColor: exp.isFromRule ? 'transparent' : '#fff',
                                cursor: exp.isFromRule ? 'not-allowed' : 'text',
                                opacity: exp.isFromRule ? 0.7 : 1,
                              }}
                              value={exp.description}
                              onChange={(e) => !exp.isFromRule && handleEditDescription(exp.id, e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              disabled={exp.isFromRule}
                              style={{
                                width: '80px',
                                padding: '4px',
                                border: exp.isFromRule ? 'none' : '1px solid #ccc',
                                borderRadius: '4px',
                                backgroundColor: exp.isFromRule ? 'transparent' : '#fff',
                                cursor: exp.isFromRule ? 'not-allowed' : 'text',
                                opacity: exp.isFromRule ? 0.7 : 1,
                              }}
                              value={exp.amountPesos}
                              onChange={(e) => !exp.isFromRule && handleEditAmountPesos(exp.id, parseFloat(e.target.value) || 0)}
                              step="0.01"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              disabled={exp.isFromRule}
                              style={{
                                width: '80px',
                                padding: '4px',
                                border: exp.isFromRule ? 'none' : '1px solid #ccc',
                                borderRadius: '4px',
                                backgroundColor: exp.isFromRule ? 'transparent' : '#fff',
                                cursor: exp.isFromRule ? 'not-allowed' : 'text',
                                opacity: exp.isFromRule ? 0.7 : 1,
                              }}
                              value={exp.amountDollars}
                              onChange={(e) => !exp.isFromRule && handleEditAmountDollars(exp.id, parseFloat(e.target.value) || 0)}
                              step="0.01"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              disabled={exp.isFromRule}
                              style={{
                                width: '80px',
                                padding: '4px',
                                border: exp.isFromRule ? 'none' : '1px solid #ccc',
                                borderRadius: '4px',
                                backgroundColor: exp.isFromRule ? 'transparent' : '#fff',
                                cursor: exp.isFromRule ? 'not-allowed' : 'text',
                                opacity: exp.isFromRule ? 0.7 : 1,
                              }}
                              placeholder="-"
                              value={exp.category || ''}
                              onChange={(e) => !exp.isFromRule && handleEditCategory(exp.id, e.target.value)}
                            />
                          </td>
                          <td>
                            <select
                              style={{
                                padding: '4px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                width: '80px',
                                backgroundColor: '#fff',
                                cursor: 'pointer',
                              }}
                              value={exp.status}
                              onChange={(e) => handleEditStatus(exp.id, e.target.value as 'done' | 'now' | 'later')}
                            >
                              <option value="done\">✅ Done</option>
                              <option value="now\">⏳ Now</option>
                              <option value="later\">📅 Later</option>
                            </select>
                          </td>
                          <td>
                            <label style={{ cursor: exp.isFromRule ? 'not-allowed' : 'pointer', opacity: exp.isFromRule ? 0.5 : 1 }}>
                              <input
                                type="checkbox"
                                disabled={exp.isFromRule}
                                checked={exp.fromCreditCard}
                                onChange={(e) => !exp.isFromRule && handleEditFromCreditCard(exp.id, e.target.checked)}
                              />
                              {exp.fromCreditCard ? '✓' : '-'}
                            </label>
                          </td>
                          <td>
                            {!exp.isFromRule && (
                              <button
                                className="button button-small"
                                onClick={() => {
                                  setSelectedExpense(exp);
                                  setShowForm(true);
                                }}
                              >
                                ✏️ Edit
                              </button>
                            )}
                            {exp.isFromRule && (
                              <span style={{ fontSize: '11px', color: '#999' }}>🔒 Rule</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
