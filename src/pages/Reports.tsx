import React from 'react';
import { StorageData } from '../types';

interface ReportsPageProps {
  data: StorageData;
  month: string;
}

export default function ReportsPage({ data, month }: ReportsPageProps) {
  return (
    <div className="page">
      <div className="page-header">
        <h2>📋 Reports</h2>
        <div className="page-actions">
          <button className="button button-primary">Export to Excel</button>
          <button className="button button-primary">Export to PDF</button>
          <button className="button button-secondary">Print</button>
        </div>
      </div>

      <div className="card">
        <h3>Monthly Summary Reports</h3>
        <p>Report generation features coming soon...</p>
      </div>
    </div>
  );
}
