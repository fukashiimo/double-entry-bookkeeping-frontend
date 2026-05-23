import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, ActionIcon, Box, Button, Center, Group, Loader, Modal, Paper, Stack, Table, Text, ThemeIcon, SimpleGrid } from '@mantine/core';
import { IconAlertCircle, IconChevronLeft, IconChevronRight, IconTrendingUp, IconTrendingDown, IconScale, IconChartPie, IconEdit } from '@tabler/icons-react';
import { useDashboard } from '../hooks/useDashboard';
import { useRealtime } from '../hooks/useRealtime';
import { useJournalEntries } from '../hooks/useJournalEntries';
import { MonthlyCalendar } from '../components/MonthlyCalendar';

interface CalendarPageProps {
  onEdit?: (data: {
    id: number;
    date: string;
    description: string;
    debit_account_name: string;
    credit_account_name: string;
    amount: number;
  }) => void;
}

const CalendarPage = ({ onEdit }: CalendarPageProps) => {
  const navigate = useNavigate();
  // null から始めて仕訳データロード後に最新月をセット（初期表示のチラツキを防止）
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalOpened, setModalOpened] = useState(false);
  const [isMonthInitialized, setIsMonthInitialized] = useState(false);

  // ダッシュボードで選択した月を表示
  const handleGoToDashboard = () => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      navigate(`/reports?year=${date.getFullYear()}&month=${date.getMonth() + 1}`);
    } else {
      navigate(`/reports?year=${selectedYear}&month=${selectedMonthNumber}`);
    }
  };

  const selectedYear = selectedMonth?.getFullYear() ?? new Date().getFullYear();
  const selectedMonthNumber = selectedMonth ? selectedMonth.getMonth() + 1 : new Date().getMonth() + 1;

  const { data: dashboardData, error, refetch } = useDashboard(selectedYear, selectedMonthNumber);
  const { journalEntries, loading: entriesLoading } = useJournalEntries();

  // 初期表示月を最新仕訳の月に合わせる（データ取得後に一度だけ設定）
  useEffect(() => {
    if (!isMonthInitialized && !entriesLoading) {
      if (journalEntries && journalEntries.length > 0) {
        const sorted = [...journalEntries].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        const lastDate = new Date(sorted[0].date);
        setSelectedMonth(new Date(lastDate.getFullYear(), lastDate.getMonth(), 1));
      } else {
        // 仕訳がない場合は今月を表示
        const now = new Date();
        setSelectedMonth(new Date(now.getFullYear(), now.getMonth(), 1));
      }
      setIsMonthInitialized(true);
    }
  }, [journalEntries, entriesLoading, isMonthInitialized]);

  // リアルタイム機能を有効化（仕訳が追加されたら自動反映）
  useRealtime({
    onJournalChange: refetch,
    onAccountChange: refetch,
  });

  const handleMonthChange = (direction: number) => {
    setSelectedMonth((prev) => {
      const base = prev ?? new Date();
      return new Date(base.getFullYear(), base.getMonth() + direction, 1);
    });
  };

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setModalOpened(true);
  };

  const selectedDateEntries = (journalEntries || []).filter(
    (entry) => entry.date === selectedDate
  );

  // 月間合計を計算 - hooks は条件分岐の前に配置
  const dailyTotals = dashboardData?.dailyTotals ?? [];
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

  // データロード完了前はローダーを表示（月のチラツキを防止）
  if (!isMonthInitialized) {
    return (
      <Center style={{ minHeight: 300 }}>
        <Loader size="md" />
      </Center>
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

  const year = dashboardData?.year ?? selectedYear;
  const month = dashboardData?.month ?? selectedMonthNumber;
  const currentMonthString = `${selectedYear}年${selectedMonthNumber}月`;

  return (
    <Stack gap="xl">
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
                月間収益
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
                月間費用
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
                利益
              </Text>
              <Text size="lg" fw={700} c={monthlyTotals.profit >= 0 ? 'blue' : 'orange'}>
                ¥{monthlyTotals.profit < 0 ? '-' : ''}{Math.abs(monthlyTotals.profit).toLocaleString()}
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
            収益は緑色、費用は赤色で表示されます。
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
        <Stack gap="md">
          {selectedDateEntries.length > 0 ? (
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>借方</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>借方金額</Table.Th>
                  <Table.Th>貸方</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>貸方金額</Table.Th>
                  <Table.Th>摘要</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {selectedDateEntries.map((entry) => (
                  <Table.Tr key={entry.id}>
                    <Table.Td>{entry.debit_account_name}</Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>{entry.amount.toLocaleString()}</Table.Td>
                    <Table.Td>{entry.credit_account_name}</Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>{entry.amount.toLocaleString()}</Table.Td>
                    <Table.Td>{entry.description}</Table.Td>
                    <Table.Td>
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        size="sm"
                        onClick={() => {
                          onEdit?.({
                            id: entry.id,
                            date: entry.date,
                            description: entry.description,
                            debit_account_name: entry.debit_account_name,
                            credit_account_name: entry.credit_account_name,
                            amount: entry.amount,
                          });
                          navigate('/journal-entry');
                          setModalOpened(false);
                        }}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          ) : (
            <Text c="dimmed" ta="center" py="xl">
              この日の仕訳はありません
            </Text>
          )}
          <Button
            leftSection={<IconChartPie size={16} />}
            variant="light"
            onClick={handleGoToDashboard}
          >
            この月をダッシュボードで表示
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default CalendarPage;


