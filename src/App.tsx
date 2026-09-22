import React, { useState, useEffect } from 'react';
import { useAppData, useCurrentMonth, useAuth } from './hooks';
import { getPreviousMonth, getNextMonth } from './utils/helpers';
import './styles/global.css';
import './App.css';

// Page components
import DashboardPage from './pages/Dashboard';
import CreditCardsPage from './pages/CreditCards';
import InvestmentsPage from './pages/Investments';
import DollarRatesPage from './pages/DollarRates';
import ServicesPage from './pages/Services';
import DebtsPage from './pages/Debts';
import ExpensesPage from './pages/Expenses';
import ReportsPage from './pages/Reports';
import AdminPage from './pages/Admin';

function App() {
  const { data, loading, error, refreshData } = useAppData();
  const { month: currentMonth } = useCurrentMonth();
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Set selectedMonth to currentMonth once it's loaded
  useEffect(() => {
    if (currentMonth) {
      setSelectedMonth(currentMonth);
    }
  }, [currentMonth]);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="app-error">
        <h2>Error Loading Application</h2>
        <p>{error || 'Unknown error'}</p>
        <button onClick={refreshData} className="button button-primary">
          Retry
        </button>
      </div>
    );
  }

  const tabs = data.config.tabs || [];

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1>💰 Expense Home</h1>
          <div className="header-right">
            <div className="month-navigation">
              <button 
                className="month-nav-btn" 
                onClick={() => setSelectedMonth(getPreviousMonth(selectedMonth))}
                title="Previous Month"
              >
                ◀
              </button>
              <div className="month-selector">
                <input 
                  type="month" 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  title="Select Month/Year"
                />
              </div>
              <button 
                className="month-nav-btn"
                onClick={() => setSelectedMonth(getNextMonth(selectedMonth))}
                title="Next Month"
              >
                ▶
              </button>
              {selectedMonth !== currentMonth && (
                <button 
                  className="month-nav-btn btn-today"
                  onClick={() => setSelectedMonth(currentMonth)}
                  title="Go to Today"
                >
                  Today
                </button>
              )}
            </div>

            {/* User Info & Settings */}
            <div className="header-user-section">
              {user && (
                <div className="user-info">
                  <div className="user-name">{user.name}</div>
                  <div className="user-email">{user.email}</div>
                </div>
              )}
              <button 
                className={`nav-tab ${currentTab === 'admin' ? 'active' : ''}`}
                onClick={() => setCurrentTab('admin')}
                title="Settings & Admin"
              >
                <span className="tab-icon">⚙️</span>
                <span className="tab-label">Settings</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="app-nav">
        <div className="nav-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`nav-tab ${currentTab === tab.id ? 'active' : ''}`}
              onClick={() => setCurrentTab(tab.id)}
              title={tab.label}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="app-main">
        {currentTab === 'dashboard' && <DashboardPage data={data} month={selectedMonth} />}
        {currentTab === 'creditCards' && <CreditCardsPage month={selectedMonth} onRefresh={refreshData} />}
        {currentTab === 'investments' && <InvestmentsPage month={selectedMonth} onRefresh={refreshData} />}
        {currentTab === 'dollarRates' && <DollarRatesPage month={selectedMonth} onRefresh={refreshData} />}
        {currentTab === 'services' && <ServicesPage month={selectedMonth} onRefresh={refreshData} />}
        {currentTab === 'debts' && <DebtsPage month={selectedMonth} onRefresh={refreshData} />}
        {currentTab === 'expenses' && <ExpensesPage month={selectedMonth} onRefresh={refreshData} />}
        {currentTab === 'reports' && <ReportsPage data={data} month={selectedMonth} />}
        {currentTab === 'admin' && <AdminPage />}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>&copy; 2026 Personal Finance Manager | All data stored locally</p>
      </footer>
    </div>
  );
}

export default App;
