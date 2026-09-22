import React, { useState } from 'react';
import DataService from '../services/DataService';
import '../components/forms.css';

interface BackupManagerProps {
  onClose?: () => void;
}

export default function BackupManager({ onClose }: BackupManagerProps) {
  const [backups, setBackups] = useState<Array<{ timestamp: string; size: number; key: string }>>([]);
  const [showBackups, setShowBackups] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadBackups = () => {
    const list = DataService.getBackupsList();
    setBackups(list);
    setShowBackups(true);
  };

  const handleExport = async () => {
    setIsLoading(true);
    try {
      await DataService.exportToJSON();
      setMessage({ type: 'success', text: '✅ Data exported successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Export failed' });
    }
    setIsLoading(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const success = await DataService.importFromJSON(file);
      if (success) {
        setMessage({ type: 'success', text: '✅ Data imported successfully!' });
        // Reload page to refresh UI
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMessage({ type: 'error', text: '❌ Import failed - invalid file format' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Import failed' });
    }
    setIsLoading(false);
  };

  const handleCreateBackup = async () => {
    setIsLoading(true);
    try {
      await DataService.createAutoBackup();
      setMessage({ type: 'success', text: '✅ Backup created successfully!' });
      loadBackups();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Backup creation failed' });
    }
    setIsLoading(false);
  };

  const handleRestoreBackup = async (backupKey: string) => {
    if (!window.confirm('⚠️ Restore this backup? Current data will be replaced.')) {
      return;
    }

    setIsLoading(true);
    try {
      const success = await DataService.restoreFromBackup(backupKey);
      if (success) {
        setMessage({ type: 'success', text: '✅ Backup restored successfully!' });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMessage({ type: 'error', text: '❌ Restore failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Restore failed' });
    }
    setIsLoading(false);
  };

  const handleDeleteBackup = (backupKey: string) => {
    if (!window.confirm('🗑️ Delete this backup permanently?')) {
      return;
    }
    try {
      localStorage.removeItem(backupKey);
      setMessage({ type: 'success', text: '✅ Backup deleted' });
      loadBackups();
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Delete failed' });
    }
  };

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h3>💾 Backup & Restore</h3>

      {message && (
        <div
          style={{
            padding: '12px',
            marginBottom: '15px',
            borderRadius: '4px',
            backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
          }}
        >
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={handleExport}
          disabled={isLoading}
          style={{
            padding: '12px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          📥 Export to File
        </button>

        <label style={{ margin: 0 }}>
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            disabled={isLoading}
            style={{ display: 'none' }}
          />
          <button
            as="span"
            onClick={(e) => (e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement)?.click()}
            disabled={isLoading}
            style={{
              padding: '12px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              width: '100%',
            }}
          >
            📤 Import from File
          </button>
        </label>

        <button
          onClick={handleCreateBackup}
          disabled={isLoading}
          style={{
            padding: '12px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
            gridColumn: '1 / 3',
          }}
        >
          🔄 Create Backup Now
        </button>
      </div>

      <button
        onClick={loadBackups}
        style={{
          padding: '10px 15px',
          marginBottom: '15px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        {showBackups ? '▼ Hide Backups' : '▶ Show Backups'}
      </button>

      {showBackups && (
        <div
          style={{
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            padding: '15px',
            maxHeight: '400px',
            overflowY: 'auto',
          }}
        >
          <h4 style={{ marginTop: 0 }}>
            📋 Available Backups ({backups.length}/5)
          </h4>
          {backups.length === 0 ? (
            <p style={{ color: '#999', marginTop: 0 }}>No backups yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {backups.map((backup) => (
                <div
                  key={backup.key}
                  style={{
                    backgroundColor: 'white',
                    padding: '12px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
                      🕐 {formatDate(backup.timestamp)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#666' }}>
                      📦 {formatSize(backup.size)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                      onClick={() => handleRestoreBackup(backup.key)}
                      disabled={isLoading}
                      title="Restore this backup"
                      style={{
                        padding: '6px 10px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        opacity: isLoading ? 0.6 : 1,
                      }}
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => handleDeleteBackup(backup.key)}
                      title="Delete this backup"
                      style={{
                        padding: '6px 10px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div
        style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#fff3cd',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#856404',
          border: '1px solid #ffeaa7',
        }}
      >
        <strong>💡 How to stay safe:</strong>
        <ul style={{ margin: '8px 0 0 20px', paddingLeft: 0 }}>
          <li>Click "Create Backup Now" regularly (manual backup)</li>
          <li>Auto-backup runs before importing data</li>
          <li>Keep last 5 backups in browser storage</li>
          <li>Always export before major changes</li>
          <li>Store exported files in cloud (Google Drive, Dropbox, etc.)</li>
        </ul>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          style={{
            marginTop: '15px',
            padding: '10px 15px',
            backgroundColor: '#e0e0e0',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Close
        </button>
      )}
    </div>
  );
}
