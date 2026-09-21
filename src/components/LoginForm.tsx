import React, { useState } from 'react';
import { useAuth } from '../hooks';
import '../styles/global.css';

export default function LoginForm() {
  const { user, login, logout } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && email.trim()) {
      login(name, email);
      setName('');
      setEmail('');
      setShowForm(false);
    }
  };

  if (user) {
    return (
      <div style={{ padding: '12px', background: '#f0f9ff', borderRadius: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666' }}>Logged in as:</p>
            <p style={{ margin: 0, fontWeight: 600, color: '#333' }}>
              {user.name} ({user.email})
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: '#999' }}>
              Provider: {user.provider === 'local' ? 'Local (Test)' : user.provider}
            </p>
          </div>
          <button 
            className="button button-secondary"
            onClick={logout}
            style={{ padding: '8px 12px', fontSize: '12px' }}
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {!showForm ? (
        <button
          className="button button-primary"
          onClick={() => setShowForm(true)}
          style={{ width: '100%' }}
        >
          👤 Login (Test Account)
        </button>
      ) : (
        <form onSubmit={handleLogin} style={{ padding: '16px', background: '#f9f9f9', borderRadius: '4px' }}>
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>

          <div className="form-group">
            <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#999' }}>
              ℹ️ Local test account (Google OAuth coming soon)
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" className="button button-primary" style={{ flex: 1 }}>
              Login
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setShowForm(false)}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
