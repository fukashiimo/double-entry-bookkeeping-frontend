import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/charts/styles.css';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import { JournalEntryForm } from './components/JournalEntry/JournalEntryForm';
import JournalList from './pages/JournalList';
import AccountSettings from './pages/AccountSettings';
import { theme } from './theme/theme';

function App() {
  const [editData, setEditData] = useState<{
    id: number;
    date: string;
    description: string;
    debit_account_name: string;
    credit_account_name: string;
    amount: number;
  } | null>(null);

  const handleSubmit = (data: { date: Date | null; [key: string]: unknown }) => {
    console.log('Form submitted:', data);
    setEditData(null); // 編集完了後は編集データをクリア
  };

  const handleEdit = (data: {
    id: number;
    date: string;
    description: string;
    debit_account_name: string;
    credit_account_name: string;
    amount: number;
  }) => {
    setEditData(data);
  };

  const handleCancelEdit = () => {
    setEditData(null);
  };

  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Router basename="/double-entry-bookkeeping-frontend">
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route 
              path="/journal-entry" 
              element={
                <JournalEntryForm 
                  onSubmit={handleSubmit} 
                  editData={editData || undefined}
                  onCancel={editData ? handleCancelEdit : undefined}
                />
              } 
            />
            <Route 
              path="/journal-list" 
              element={<JournalList onEdit={handleEdit} />} 
            />
            <Route path="/account-settings" element={<AccountSettings />} />
            <Route path="/reports" element={<div>財務レポート（準備中）</div>} />
          </Routes>
        </MainLayout>
      </Router>
    </MantineProvider>
  );
}

export default App;