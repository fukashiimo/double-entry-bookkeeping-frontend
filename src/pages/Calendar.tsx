import { useState } from 'react';
import { Alert, ActionIcon, Box, Group, Loader, Modal, Paper, Stack, Table, Text, Title } from '@mantine/core';
import { IconAlertCircle, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useDashboard } from '../hooks/useDashboard';
import { useRealtime } from '../hooks/useRealtime';
import { useJournalEntries } from '../hooks/useJournalEntries';
import { MonthlyCalendar } from '../components/MonthlyCalendar';

const CalendarPage = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalOpened, setModalOpened] = useState(false);

  const selectedYear = selectedMonth.getFullYear();
  const selectedMonthNumber = selectedMonth.getMonth() + 1;

  const { data: dashboardData, loading, error, refetch } = useDashboard(selectedYear, selectedMonthNumber);
  const { journalEntries } = useJournalEntries();

  // リアルタイム機能を有効化（仕訳が追加されたら自動反映）
  useRealtime({
    onJournalChange: refetch,
    onAccountChange: refetch,
  });

  const handleMonthChange = (direction: number) => {
    setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  };

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setModalOpened(true);
  };

  const selectedDateEntries = (journalEntries || []).filter(
    (entry) => entry.date === selectedDate
  );

  if (loading) {
    return (
      <Stack align="center" justify="center" h="50vh">
        <Loader size="lg" />
        <Text>カレンダーのデータを読み込み中...</Text>
      </Stack>
    );
  }

  const isNoDataError = error?.includes('status: 500');

  if (error && !isNoDataError) {
    return (
      <Alert icon={<IconAlertCircle size="1rem" />} title="エラー" color="red">
        {error}
      </Alert>
    );
  }

  if (!dashboardData && !isNoDataError) {
    return (
      <Alert icon={<IconAlertCircle size="1rem" />} title="データなし" color="yellow">
        データを取得できませんでした。
      </Alert>
    );
  }

  const year = dashboardData?.year ?? selectedYear;
  const month = dashboardData?.month ?? selectedMonthNumber;
  const dailyTotals = dashboardData?.dailyTotals ?? [];
  const currentMonthString = `${selectedYear}年${selectedMonthNumber}月`;

  return (
    <Stack gap="xl">
      <Box>
        <Title order={3} mb="xs">
          家計カレンダー
        </Title>
        <Text size="sm" c="dimmed">
          日ごとの収入（緑）・支出（赤）をカレンダー形式で確認できます。
        </Text>
      </Box>

      {isNoDataError && (
        <Alert icon={<IconAlertCircle size="1rem" />} title="データなし" color="yellow">
          この月のデータはありません。
        </Alert>
      )}

      <Paper p="xl" radius="md" withBorder>
        <Group justify="space-between" mb="lg">
          <Group gap="xs" align="center">
            <ActionIcon
              variant="light"
                            aria-label="前の月へ"
              onClick={() => handleMonthChange(-1)}
            >
              <IconChevronLeft size={18} />
            </ActionIcon>
            <Text fw={600}>{currentMonthString}</Text>
            <ActionIcon
              variant="light"
                            aria-label="次の月へ"
              onClick={() => handleMonthChange(1)}
            >
              <IconChevronRight size={18} />
            </ActionIcon>
          </Group>

          <Text size="sm" c="dimmed">
            収入は緑色、支出は赤色で表示されます。
          </Text>
        </Group>

        <MonthlyCalendar
          year={year}
          month={month}
          dailyTotals={dailyTotals}
          onDateClick={handleDateClick}
        />
      </Paper>

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={selectedDate ? `${selectedDate} の仕訳一覧` : '仕訳一覧'}
        size="lg"
      >
        {selectedDateEntries.length > 0 ? (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>借方</Table.Th>
                <Table.Th>貸方</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>金額</Table.Th>
                <Table.Th>摘要</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {selectedDateEntries.map((entry) => (
                <Table.Tr key={entry.id}>
                  <Table.Td>{entry.debit_account_name}</Table.Td>
                  <Table.Td>{entry.credit_account_name}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    {entry.amount.toLocaleString()}
                  </Table.Td>
                  <Table.Td>{entry.description}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <Text c="dimmed" ta="center" py="xl">
            この日の仕訳はありません
          </Text>
        )}
      </Modal>
    </Stack>
  );
};

export default CalendarPage;


