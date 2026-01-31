import { Grid, Paper, Text, Title, Group, Stack, Button, Box, Container, Loader, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { PieChart } from '@mantine/charts';
import { useDashboard } from '../hooks/useDashboard';
import { useRealtime } from '../hooks/useRealtime';

const Dashboard = () => {
  const { data: dashboardData, loading, error } = useDashboard();
  
  // リアルタイム機能を有効化
  useRealtime();

  // データが読み込み中の場合はローダーを表示
  if (loading) {
    return (
      <Stack align="center" justify="center" h="50vh">
        <Loader size="lg" />
        <Text>データを読み込み中...</Text>
      </Stack>
    );
  }

  // エラーがある場合はエラーメッセージを表示
  if (error) {
    return (
      <Alert icon={<IconAlertCircle size="1rem" />} title="エラー" color="red">
        {error}
      </Alert>
    );
  }

  // データがない場合
  if (!dashboardData) {
    return (
      <Alert icon={<IconAlertCircle size="1rem" />} title="データなし" color="yellow">
        データを取得できませんでした。
      </Alert>
    );
  }

  // ダッシュボードデータから情報を取得
  const { year, month, accounts, journalEntries, incomeData, expenseData, summary } = dashboardData;
  const currentMonthString = `${year}年${month}月`;

  // 色の配列（温かみのあるチームみらい風の色）
  const colors = [
    '#F7931E', '#E53E3E', '#16A34A', '#F59E0B', '#FF8A95',
    '#86EFAC', '#FBBF24', '#FFB3BA', '#4ADE80', '#FCD34D'
  ];

  // デバッグ用: データの内容をコンソールに出力
  console.log('=== DASHBOARD DEBUG INFO ===');
  console.log('Year:', year);
  console.log('Month:', month);
  console.log('Current Month String:', currentMonthString);
  console.log('Accounts Data:', accounts);
  console.log('Journal Entries:', journalEntries);
  console.log('Income Data:', incomeData);
  console.log('Expense Data:', expenseData);
  console.log('Summary:', summary);
  console.log('================================');

  // 円グラフ用のデータを準備（色を追加）
  const expenseChartData = expenseData.map((item, index) => ({
    ...item,
    color: colors[index % colors.length]
  }));

  const hasBalanceSheetData = Boolean(
    dashboardData.balanceSheet &&
      (dashboardData.balanceSheet.assets.length > 0 ||
        dashboardData.balanceSheet.liabilities.length > 0 ||
        dashboardData.balanceSheet.equity.length > 0)
  );
  const balanceSheetData = hasBalanceSheetData ? dashboardData.balanceSheet : {
    assets: accounts.assets.map(account => ({
      name: account.name,
      amount: 0
    })),
    liabilities: accounts.liabilities.map(account => ({
      name: account.name,
      amount: 0
    })),
    equity: accounts.equity.map(account => ({
      name: account.name,
      amount: 0
    })),
  };

  const totalLiabilities = balanceSheetData.liabilities.reduce((sum, item) => sum + item.amount, 0);
  const totalEquity = balanceSheetData.equity.reduce((sum, item) => sum + item.amount, 0);
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  // 収支サマリーの計算
  const totalRevenue = incomeData.reduce((sum, item) => sum + item.value, 0);
  const totalExpenses = expenseData.reduce((sum, item) => sum + item.value, 0);
  const netIncome = totalRevenue - totalExpenses;

  return (
    <Stack gap="xl">
      {/* 選択月の家計簿（ハイライト） */}
      <Paper p="xl" radius="md" withBorder>
        <Group justify="space-between" mb="xl">
          <Title order={4}>{currentMonthString}の家計サマリー</Title>
          <Button
            variant="subtle"
            size="md"
            color="orange"
            style={{ color: '#F7931E' }}
          >
            {currentMonthString}
          </Button>
        </Group>

        <Grid gutter={80}>
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Container size="100%" p={0}>
              <Grid gutter="xl">
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Stack align="center">
                    <Text size="sm" c="dimmed">支出</Text>
                    <Box w={{ base: 240, sm: 280 }} h={{ base: 240, sm: 280 }}>
                      {expenseChartData.length > 0 ? (
                        <PieChart
                          data={expenseChartData}
                          withLabels
                          labelsType="percent"
                          tooltipDataSource="segment"
                          valueFormatter={(value) => `¥${value.toLocaleString()}`}
                        />
                      ) : (
                        <Stack align="center" justify="center" h="100%">
                          <Text size="sm" c="dimmed">データがありません</Text>
                        </Stack>
                      )}
                    </Box>
                  </Stack>
                </Grid.Col>
              </Grid>
            </Container>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 4 }}>
          <Paper withBorder p="xl" radius="md" style={{ height: '100%', minHeight: '280px' }}>
              <Stack justify="center" h="100%">
                <Text size="sm" c="dimmed" mb="lg">収支サマリー</Text>
                <Stack gap="lg">
                  <Stack gap={4}>
                    <Text size="sm">収益</Text>
                    <Group gap="xs" align="baseline">
                      <Text size="lg" fw={600} c="green">+{summary.totalRevenue.toLocaleString()}</Text>
                      <Text size="sm" c="dimmed">円</Text>
                    </Group>
                  </Stack>
                  <Stack gap={4}>
                    <Text size="sm">支出</Text>
                    <Group gap="xs" align="baseline">
                      <Text size="lg" fw={600} c="red">-{summary.totalExpenses.toLocaleString()}</Text>
                      <Text size="sm" c="dimmed">円</Text>
                    </Group>
                  </Stack>
                </Stack>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
      </Paper>

      <Grid gutter="xl">
        {/* 貸借対照表 */}
        <Grid.Col span={12}>
          <Paper p="xl" radius="md" withBorder>
            <Title order={4} mb="xl">貸借対照表</Title>
            <Grid gutter="xl">
              {/* 資産 */}
              <Grid.Col span={6}>
                <Box style={{ display: 'flex', flexDirection: 'column', height: 360 }}>
                  <Text size="sm" c="dimmed">資産</Text>
                  <Box style={{ flex: 1, overflowY: 'auto', paddingRight: 4, minHeight: 220 }}>
                    {balanceSheetData.assets.map((item, index) => (
                      <Group key={index} justify="space-between" mb="md">
                        <Text size="sm">{item.name}</Text>
                        <Text size="sm">{item.amount.toLocaleString()}円</Text>
                      </Group>
                    ))}
                  </Box>
                  <Group justify="space-between" pt="md" style={{ borderTop: '1px solid #eee', marginTop: 'auto' }}>
                    <Text fw={500}>合計</Text>
                    <Text fw={500}>
                      {balanceSheetData.assets.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}円
                    </Text>
                  </Group>
                </Box>
              </Grid.Col>

              {/* 負債・純資産（分割表示） */}
              <Grid.Col span={6}>
                <Box style={{ display: 'flex', flexDirection: 'column', height: 360 }}>
                  <Text size="sm" c="dimmed">負債</Text>
                  <Box style={{ flex: 1, overflowY: 'auto', paddingRight: 4, minHeight: 140 }}>
                    {balanceSheetData.liabilities.map((item, index) => (
                      <Group key={`liab-${index}`} justify="space-between" mb="md">
                        <Text size="sm">{item.name}</Text>
                        <Text size="sm">{item.amount.toLocaleString()}円</Text>
                      </Group>
                    ))}
                  </Box>

                  <Text size="sm" c="dimmed" mt="md">純資産</Text>
                  <Box style={{ flex: 1, overflowY: 'auto', paddingRight: 4, minHeight: 140 }}>
                    {balanceSheetData.equity.map((item, index) => (
                      <Group key={`equity-${index}`} justify="space-between" mb="md">
                        <Text size="sm">{item.name}</Text>
                        <Text size="sm">{item.amount.toLocaleString()}円</Text>
                      </Group>
                    ))}
                  </Box>

                  <Group justify="space-between" pt="md" style={{ borderTop: '1px solid #eee', marginTop: 'auto' }}>
                    <Text fw={500}>合計</Text>
                    <Text fw={500}>{totalLiabilitiesAndEquity.toLocaleString()}円</Text>
                  </Group>
                </Box>
              </Grid.Col>
            </Grid>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* 収支計算書 */}
      <Grid gutter="xl">
        <Grid.Col span={12}>
          <Paper p="xl" radius="md" withBorder>
            <Title order={4} mb="xl">収支計算書</Title>
            <Stack gap="md">
              {incomeData.map((item, index) => (
                <Group key={index} justify="space-between">
                  <Text size="sm">収益　{item.name}</Text>
                  <Text size="sm" fw={500}>{item.value.toLocaleString()}円</Text>
                </Group>
              ))}
              <Group justify="space-between" pt="md" style={{ borderTop: '1px solid #e9ecef' }}>
                <Text size="sm" fw={600}>収益合計</Text>
                <Text size="sm" fw={600}>{totalRevenue.toLocaleString()}円</Text>
              </Group>

              {expenseData.map((item, index) => (
                <Group key={`expense-${index}`} justify="space-between">
                  <Text size="sm">費用　{item.name}</Text>
                  <Text size="sm" fw={500}>{item.value.toLocaleString()}円</Text>
                </Group>
              ))}
              <Group justify="space-between" pt="md" style={{ borderTop: '1px solid #e9ecef' }}>
                <Text size="sm" fw={600}>費用合計</Text>
                <Text size="sm" fw={600}>{totalExpenses.toLocaleString()}円</Text>
              </Group>

              <Group justify="space-between" pt="md" style={{ borderTop: '2px solid #e9ecef' }}>
                <Text size="md" fw={700}>収支合計</Text>
                <Text size="md" fw={700} style={{ color: netIncome >= 0 ? '#16A34A' : '#DC2626' }}>
                  {netIncome.toLocaleString()}円
                </Text>
              </Group>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  );
};

export default Dashboard;
