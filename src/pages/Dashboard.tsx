import { Grid, Paper, Text, Title, Group, Stack, Button, ActionIcon, Box, Container, Loader, Alert } from '@mantine/core';
import { IconPlus, IconAlertCircle } from '@tabler/icons-react';
import { PieChart } from '@mantine/charts';
import { useNavigate } from 'react-router-dom';
import { useAccounts } from '../hooks/useAccounts';
import { useJournalEntries } from '../hooks/useJournalEntries';
import { useRealtime } from '../hooks/useRealtime';

const Dashboard = () => {
  const navigate = useNavigate();
  const { accounts, loading: accountsLoading, error: accountsError } = useAccounts();
  const { journalEntries, loading: entriesLoading, error: entriesError } = useJournalEntries();
  
  // リアルタイム機能を有効化
  useRealtime();

  // データが読み込み中の場合はローダーを表示
  if (accountsLoading || entriesLoading) {
    return (
      <Stack align="center" justify="center" h="50vh">
        <Loader size="lg" />
        <Text>データを読み込み中...</Text>
      </Stack>
    );
  }

  // エラーがある場合はエラーメッセージを表示
  if (accountsError || entriesError) {
    return (
      <Alert icon={<IconAlertCircle size="1rem" />} title="エラー" color="red">
        {accountsError || entriesError}
      </Alert>
    );
  }

  // 仕訳データから実際の金額を計算する関数
  const calculateAccountAmounts = (accountName: string) => {
    if (!journalEntries) return 0;
    
    let total = 0;
    journalEntries.forEach(entry => {
      if (entry.debit_account_name === accountName) {
        total += entry.amount; // 借方の場合はプラス
      }
      if (entry.credit_account_name === accountName) {
        total -= entry.amount; // 貸方の場合はマイナス
      }
    });
    return Math.abs(total); // 絶対値で表示
  };

  // 色の配列（会計ソフトウェアらしい色）
  const colors = [
    '#16A34A', '#DC2626', '#2563EB', '#F97316', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F59E0B', '#6366F1'
  ];

  // 実際のデータから収益・費用データを生成
  const incomeData = accounts?.revenue.map((account, index) => ({
    name: account.name,
    value: calculateAccountAmounts(account.name),
    color: colors[index % colors.length]
  })).filter(item => item.value > 0) || [];

  const expenseData = accounts?.expenses.map((account, index) => ({
    name: account.name,
    value: calculateAccountAmounts(account.name),
    color: colors[index % colors.length]
  })).filter(item => item.value > 0) || [];

  // 実際のデータから貸借対照表データを生成
  const balanceSheetData = {
    assets: accounts?.assets.map(account => ({
      name: account.name,
      amount: calculateAccountAmounts(account.name)
    })) || [],
    liabilities: accounts?.liabilities.map(account => ({
      name: account.name,
      amount: calculateAccountAmounts(account.name)
    })) || [],
  };

  // 収支サマリーの計算
  const totalRevenue = incomeData.reduce((sum, item) => sum + item.value, 0);
  const totalExpenses = expenseData.reduce((sum, item) => sum + item.value, 0);
  const netIncome = totalRevenue - totalExpenses;

  return (
    <Stack gap="xl">
      <Grid gutter="xl">
        {/* 貸借対照表 */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper shadow="sm" p="xl" radius="lg">
            <Title order={4} mb="xl">貸借対照表</Title>
            <Grid gutter="xl">
              {/* 資産 */}
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed" mb="md">資産</Text>
                {balanceSheetData.assets.map((item, index) => (
                  <Group key={index} justify="space-between" mb="md">
                    <Text size="sm">{item.name}</Text>
                    <Text size="sm">{item.amount.toLocaleString()}円</Text>
                  </Group>
                ))}
                <Group justify="space-between" mt="xl" pt="md" style={{ borderTop: '1px solid #eee' }}>
                  <Text fw={500}>合計</Text>
                  <Text fw={500}>
                    {balanceSheetData.assets.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}円
                  </Text>
                </Group>
              </Grid.Col>

              {/* 負債・純資産 */}
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed" mb="md">負債・純資産</Text>
                {balanceSheetData.liabilities.map((item, index) => (
                  <Group key={index} justify="space-between" mb="md">
                    <Text size="sm">{item.name}</Text>
                    <Text size="sm">{item.amount.toLocaleString()}円</Text>
                  </Group>
                ))}
                <Group justify="space-between" mt="xl" pt="md" style={{ borderTop: '1px solid #eee' }}>
                  <Text fw={500}>合計</Text>
                  <Text fw={500}>
                    {balanceSheetData.liabilities.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}円
                  </Text>
                </Group>
              </Grid.Col>
            </Grid>
          </Paper>
        </Grid.Col>

        {/* 仕訳入力ボタン */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper shadow="sm" p="xl" radius="lg" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Stack align="center" gap="lg">
              <ActionIcon
                size={80}
                radius="xl"
                variant="light"
                color="blue"
                onClick={() => navigate('/journal-entry')}
                style={{ backgroundColor: '#EBF5FF' }}
              >
                <IconPlus size={40} />
              </ActionIcon>
              <Box ta="center">
                <Title order={4} mb="xs">仕訳を入力</Title>
                <Text size="sm" c="dimmed">
                  新しい取引を記録する
                </Text>
              </Box>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* 今月の家計簿 */}
      <Paper shadow="sm" p="xl" radius="lg">
        <Group justify="space-between" mb="xl">
          <Title order={4}>今月の家計簿</Title>
          <Button 
            variant="subtle" 
            size="md"
            color="blue"
            style={{ color: '#3B82F6' }}
          >
            2024年3月
          </Button>
        </Group>
        
        <Grid gutter={80}>
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Container size="100%" p={0}>
              <Grid gutter="xl">
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Stack align="center">
                    <Text size="sm" c="dimmed">収益</Text>
                    <Box w={{ base: 240, sm: 280 }} h={{ base: 240, sm: 280 }}>
                      <PieChart
                        data={incomeData}
                        withLabels
                        labelsType="percent"
                        tooltipDataSource="segment"
                        valueFormatter={(value) => `¥${value.toLocaleString()}`}
                      />
                    </Box>
                  </Stack>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Stack align="center">
                    <Text size="sm" c="dimmed">支出</Text>
                    <Box w={{ base: 240, sm: 280 }} h={{ base: 240, sm: 280 }}>
                      <PieChart
                        data={expenseData}
                        withLabels
                        labelsType="percent"
                        tooltipDataSource="segment"
                        valueFormatter={(value) => `¥${value.toLocaleString()}`}
                      />
                    </Box>
                  </Stack>
                </Grid.Col>
              </Grid>
            </Container>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Paper withBorder p="xl" radius="lg" style={{ height: '100%', minHeight: '280px' }}>
              <Stack justify="center" h="100%">
                <Text size="sm" c="dimmed" mb="lg">収支サマリー</Text>
                <Stack gap="lg">
                  <Group justify="space-between">
                    <Text size="sm">収益</Text>
                    <Text size="lg" fw={500}>¥{totalRevenue.toLocaleString()}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm">支出</Text>
                    <Text size="lg" fw={500}>¥{totalExpenses.toLocaleString()}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm">利益</Text>
                    <Text size="lg" fw={500} style={{ color: netIncome >= 0 ? '#16A34A' : '#DC2626' }}>
                      ¥{netIncome.toLocaleString()}
                    </Text>
                  </Group>
                </Stack>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
      </Paper>
    </Stack>
  );
};

export default Dashboard;