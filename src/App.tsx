import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/charts/styles.css';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import { JournalEntryForm } from './components/JournalEntry/JournalEntryForm';
import JournalList from './pages/JournalList';
import AccountSettings from './pages/AccountSettings';
import Login from './pages/Login';
import { theme } from './theme/theme';

function AppContent() {
  const navigate = useNavigate();
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
    // 仕訳帳に遷移
    navigate('/journal-list');
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
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
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
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Router basename="/double-entry-bookkeeping-frontend">
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </MantineProvider>
  );
}

export default App;