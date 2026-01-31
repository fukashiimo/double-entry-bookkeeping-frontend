import { useState } from 'react';
import { Alert, ActionIcon, Box, Group, Loader, Paper, Stack, Text, Title } from '@mantine/core';
import { IconAlertCircle, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useDashboard } from '../hooks/useDashboard';
import { useRealtime } from '../hooks/useRealtime';
import { MonthlyCalendar } from '../components/MonthlyCalendar';

const CalendarPage = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const selectedYear = selectedMonth.getFullYear();
  const selectedMonthNumber = selectedMonth.getMonth() + 1;

  const { data: dashboardData, loading, error } = useDashboard(selectedYear, selectedMonthNumber);

  // リアルタイム機能を有効化（仕訳が追加されたら自動反映）
  useRealtime();

  const handleMonthChange = (direction: number) => {
    setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  };

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
              color="orange"
              aria-label="前の月へ"
              onClick={() => handleMonthChange(-1)}
            >
              <IconChevronLeft size={18} />
            </ActionIcon>
            <Text fw={600}>{currentMonthString}</Text>
            <ActionIcon
              variant="light"
              color="orange"
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

        <MonthlyCalendar year={year} month={month} dailyTotals={dailyTotals} />
      </Paper>
    </Stack>
  );
};

export default CalendarPage;


