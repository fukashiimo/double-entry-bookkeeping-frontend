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
  const handleSubmit = (data: { date: Date | null; [key: string]: unknown }) => {
    console.log('Form submitted:', data);
  };

  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Router basename="/double-entry-bookkeeping">
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/journal-entry" element={<JournalEntryForm onSubmit={handleSubmit} />} />
            <Route path="/journal-list" element={<JournalList />} />
            <Route path="/account-settings" element={<AccountSettings />} />
            <Route path="/reports" element={<div>財務レポート（準備中）</div>} />
          </Routes>
        </MainLayout>
      </Router>
    </MantineProvider>
  );
}

export default App;