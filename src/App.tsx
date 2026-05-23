import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { MantineProvider, localStorageColorSchemeManager } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/notifications/styles.css';
import { Notifications } from '@mantine/notifications';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import MainLayout from './components/Layout/MainLayout';
import { JournalEntryForm } from './components/JournalEntry/JournalEntryForm';
import JournalList from './pages/JournalList';
import AccountSettings from './pages/AccountSettings';
import MyPage from './pages/MyPage';
import CalendarPage from './pages/Calendar';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Pricing from './pages/Pricing';
import Login from './pages/Login';
import { theme } from './theme/theme';
import { createTheme } from '@mantine/core';

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

  const handleSubmit = (_data: { date: Date | null; [key: string]: unknown }, isEditMode?: boolean) => {
    if (isEditMode) {
      setEditData(null);
      navigate('/journal-list');
    }
    // 新規登録の場合は同じ画面に留まる（連続入力対応）
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
                <Route path="/" element={<Navigate to="/reports" replace />} />
                <Route
                  path="/journal-entry"
                  element={
                    <JournalEntryForm
                      key={editData?.id ?? 'new'}
                      onSubmit={handleSubmit}
                      editData={editData || undefined}
                      onCancel={editData ? handleCancelEdit : undefined}
                      onEdit={handleEdit}
                    />
                  }
                />
                <Route 
                  path="/journal-list" 
                  element={<JournalList onEdit={handleEdit} />}
                />
                <Route path="/account-settings" element={<AccountSettings />} />
                <Route path="/mypage" element={<MyPage />} />
                <Route path="/calendar" element={<CalendarPage onEdit={handleEdit} />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/reports" element={<Reports />} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function ThemedApp() {
  const { primaryColor } = useTheme();
  
  const dynamicTheme = createTheme({
    ...theme,
    primaryColor: primaryColor,
  });

  return (
    <MantineProvider
      theme={dynamicTheme}
      defaultColorScheme="light"
      colorSchemeManager={localStorageColorSchemeManager({ key: 'color-scheme' })}
    >
      <Notifications position="top-right" />
      <AppContent />
    </MantineProvider>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <ThemedApp />
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
