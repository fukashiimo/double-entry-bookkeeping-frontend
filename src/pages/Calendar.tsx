import { useState, useMemo } from 'react';
import { Alert, ActionIcon, Box, Group, Loader, Modal, Paper, Stack, Table, Text, Title, ThemeIcon, SimpleGrid } from '@mantine/core';
import { IconAlertCircle, IconChevronLeft, IconChevronRight, IconTrendingUp, IconTrendingDown, IconScale } from '@tabler/icons-react';
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

  // 月間合計を計算
  const monthlyTotals = useMemo(() => {
    let income = 0;
    let expenses = 0;
    for (const day of dailyTotals) {
      income += day.income || 0;
      expenses += day.expenses || 0;
    }
    return {
      income,
      expense: expenses,
      profit: income - expenses,
    };
  }, [dailyTotals]);

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

      {/* 月間合計サマリー */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <Paper p="md" radius="md" withBorder>
          <Group>
            <ThemeIcon color="teal" size="lg" radius="md" variant="light">
              <IconTrendingUp size={20} />
            </ThemeIcon>
            <Box>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                月間収入
              </Text>
              <Text size="lg" fw={700} c="teal">
                ¥{monthlyTotals.income.toLocaleString()}
              </Text>
            </Box>
          </Group>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group>
            <ThemeIcon color="red" size="lg" radius="md" variant="light">
              <IconTrendingDown size={20} />
            </ThemeIcon>
            <Box>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                月間支出
              </Text>
              <Text size="lg" fw={700} c="red">
                ¥{monthlyTotals.expense.toLocaleString()}
              </Text>
            </Box>
          </Group>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group>
            <ThemeIcon color={monthlyTotals.profit >= 0 ? 'blue' : 'orange'} size="lg" radius="md" variant="light">
              <IconScale size={20} />
            </ThemeIcon>
            <Box>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                収支
              </Text>
              <Text size="lg" fw={700} c={monthlyTotals.profit >= 0 ? 'blue' : 'orange'}>
                {monthlyTotals.profit >= 0 ? '+' : ''}¥{monthlyTotals.profit.toLocaleString()}
              </Text>
            </Box>
          </Group>
        </Paper>
      </SimpleGrid>

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


