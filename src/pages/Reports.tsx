import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Paper,
  Title,
  Stack,
  Grid,
  Text,
  Group,
  SegmentedControl,
  Table,
  Alert,
  Card,
  ThemeIcon,
  Divider,
  Badge,
  Button,
  SimpleGrid,
  Switch,
  Select,
  Box,
  Skeleton,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconTrendingUp,
  IconTrendingDown,
  IconWallet,
  IconReceipt,
  IconPigMoney,
  IconBuildingBank,
  IconChevronLeft,
  IconChevronRight,
  IconCalendarStats
} from '@tabler/icons-react';
import { PieChart } from '@mantine/charts';
import { useDashboard } from '../hooks/useDashboard';
import { useJournalEntries } from '../hooks/useJournalEntries';

export default function Reports() {
  const currentYear = new Date().getFullYear();
  const [searchParams] = useSearchParams();
  const urlYear = searchParams.get('year');
  const urlMonth = searchParams.get('month');

  const [selectedYear, setSelectedYear] = useState<number>(() => {
    if (urlYear) return parseInt(urlYear, 10);
    return currentYear;
  });
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    if (urlMonth) return parseInt(urlMonth, 10);
    return new Date().getMonth() + 1;
  });
  const [reportType, setReportType] = useState<string>('summary');
  const [hideZeroAccounts, setHideZeroAccounts] = useState<boolean>(false);
  const [showAllSubaccounts, setShowAllSubaccounts] = useState<boolean>(false);
  const [expandedSubaccounts, setExpandedSubaccounts] = useState<Record<string, boolean>>({});
  const [isInitialized, setIsInitialized] = useState<boolean>(!!urlYear || !!urlMonth);
  // 期間選択モード: 'single' = 単月, 'range' = 範囲選択, 'annual' = 年間累計
  const [periodMode, setPeriodMode] = useState<'single' | 'range' | 'annual'>('single');
  const [startMonth, setStartMonth] = useState<number>(1);
  const [endMonth, setEndMonth] = useState<number>(12);

  // 仕訳データを取得（最終入力日の取得用）
  const { journalEntries } = useJournalEntries();

  // 最終入力日を取得して初期表示月を設定（URLパラメータがない場合のみ）
  useEffect(() => {
    if (!isInitialized && journalEntries && journalEntries.length > 0) {
      // 最新の仕訳の日付を取得
      const sortedEntries = [...journalEntries].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const lastEntryDate = new Date(sortedEntries[0].date);
      setSelectedYear(lastEntryDate.getFullYear());
      setSelectedMonth(lastEntryDate.getMonth() + 1);
      setIsInitialized(true);
    }
  }, [journalEntries, isInitialized]);

  const dashboardOptions = useMemo(() => ({
    periodMode,
    startMonth,
    endMonth,
  }), [periodMode, startMonth, endMonth]);

  const { data, loading, error } = useDashboard(selectedYear, selectedMonth, dashboardOptions);

  // 年選択用のオプション（無料版でも全期間閲覧可能）
  const yearOptions = useMemo(() => {
    return [
      { value: String(currentYear - 2), label: `${currentYear - 2}年` },
      { value: String(currentYear - 1), label: `${currentYear - 1}年` },
      { value: String(currentYear), label: `${currentYear}年` },
      { value: String(currentYear + 1), label: `${currentYear + 1}年` },
    ];
  }, [currentYear]);

  // 貸借対照表データ（0円フィルター適用）- hooks は条件分岐の前に配置
  const filteredAssets = useMemo(() => {
    const assets = data?.balanceSheet?.assets || [];
    return hideZeroAccounts ? assets.filter(item => item.amount !== 0) : assets;
  }, [data?.balanceSheet?.assets, hideZeroAccounts]);

  const filteredLiabilities = useMemo(() => {
    const liabilities = data?.balanceSheet?.liabilities || [];
    return hideZeroAccounts ? liabilities.filter(item => item.amount !== 0) : liabilities;
  }, [data?.balanceSheet?.liabilities, hideZeroAccounts]);

  const filteredEquity = useMemo(() => {
    const equity = data?.balanceSheet?.equity || [];
    return hideZeroAccounts ? equity.filter(item => item.amount !== 0) : equity;
  }, [data?.balanceSheet?.equity, hideZeroAccounts]);

  // 損益計算書データ（0円フィルター適用）
  const filteredIncomeData = useMemo(() => {
    const incomeData = data?.incomeData || [];
    return hideZeroAccounts ? incomeData.filter((item: { name: string; value: number }) => item.value !== 0) : incomeData;
  }, [data?.incomeData, hideZeroAccounts]);

  const filteredExpenseData = useMemo(() => {
    const expenseData = data?.expenseData || [];
    return hideZeroAccounts ? expenseData.filter((item: { name: string; value: number }) => item.value !== 0) : expenseData;
  }, [data?.expenseData, hideZeroAccounts]);

  // ツールチップフォーマット関数
  const tooltipFormatter = (value: number) => `¥${value.toLocaleString()}`;

  if (error) {
    return (
      <Alert icon={<IconAlertCircle size="1rem" />} title="エラー" color="red">
        {error}
      </Alert>
    );
  }

  const totalAssets = data?.balanceSheet?.assets?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const totalLiabilities = data?.balanceSheet?.liabilities?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const totalEquity = data?.balanceSheet?.equity?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const totalAssetsDisplay = totalAssets;
  const totalLiabilitiesDisplay = totalLiabilities;
  const totalEquityDisplay = totalEquity;

  // マイナス残高を△表記で表示（日本の会計慣行）
  const formatAmount = (amount: number) =>
    amount < 0 ? `△${Math.abs(amount).toLocaleString()}` : amount.toLocaleString();
  const totalRevenue = data?.summary?.totalRevenue || 0;
  const totalExpenses = data?.summary?.totalExpenses || 0;
  const netIncome = data?.summary?.netIncome || 0;

  // 円グラフ用データ（0より大きいもののみ）
  const expenseChartData = (data?.expenseData || [])
    .filter((item: { name: string; value: number }) => item.value > 0)
    .map((item: { name: string; value: number }, index: number) => ({
      name: item.name,
      value: item.value,
      color: ['red.6', 'orange.6', 'yellow.6', 'teal.6', 'blue.6', 'violet.6', 'pink.6'][index % 7]
    }));

  const revenueChartData = (data?.incomeData || [])
    .filter((item: { name: string; value: number }) => item.value > 0)
    .map((item: { name: string; value: number }, index: number) => ({
      name: item.name,
      value: item.value,
      color: ['green.6', 'teal.6', 'cyan.6', 'blue.6', 'indigo.6'][index % 5]
    }));

  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const isSubaccountVisible = (key: string) => showAllSubaccounts || !!expandedSubaccounts[key];
  const toggleSubaccount = (key: string) => {
    setExpandedSubaccounts(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>ダッシュボード</Title>
        <Group gap="xs">
          <Switch
            label="0円非表示"
            checked={hideZeroAccounts}
            onChange={(event) => setHideZeroAccounts(event.currentTarget.checked)}
            size="sm"
          />
          <Switch
            label="補助科目を全表示"
            checked={showAllSubaccounts}
            onChange={(event) => setShowAllSubaccounts(event.currentTarget.checked)}
            size="sm"
          />
        </Group>
      </Group>

      {/* 年・月選択 */}
      <Paper p="md" radius="md" withBorder>
          <Group justify="space-between" mb="md">
          <Group gap="xs">
            <Button
              variant="subtle"
              size="compact-sm"
              leftSection={<IconChevronLeft size={14} />}
              onClick={() => setSelectedYear(y => y - 1)}
            >
              前年
            </Button>
            <Select
              value={String(selectedYear)}
              onChange={(val) => val && setSelectedYear(parseInt(val, 10))}
              data={yearOptions}
              style={{ width: 110 }}
              size="sm"
            />
            <Button
              variant="subtle"
              size="compact-sm"
              rightSection={<IconChevronRight size={14} />}
              onClick={() => setSelectedYear(y => y + 1)}
            >
              翌年
            </Button>
          </Group>
          <Group gap="xs">
            <SegmentedControl
              value={periodMode}
              onChange={(value) => {
                setPeriodMode(value as 'single' | 'range' | 'annual');
                if (value === 'annual') {
                  setStartMonth(1);
                  setEndMonth(12);
                }
              }}
              data={[
                { label: '単月', value: 'single' },
                { label: '期間選択', value: 'range' },
                { label: '年間累計', value: 'annual' },
              ]}
              size="xs"
            />
          </Group>
        </Group>

        {/* 期間表示 */}
        <Group justify="center" mb="sm">
          <Text fw={600} size="lg">
            {periodMode === 'single' && `${selectedYear}年${selectedMonth}月`}
            {periodMode === 'range' && `${selectedYear}年${startMonth}月〜${endMonth}月`}
            {periodMode === 'annual' && `${selectedYear}年 年間累計（1月〜12月）`}
          </Text>
        </Group>

        {/* 単月選択 */}
        {periodMode === 'single' && (
          <SimpleGrid cols={{ base: 4, sm: 6, md: 12 }} spacing="xs">
            {months.map((m) => (
              <Button
                key={m}
                variant={selectedMonth === m ? 'filled' : 'light'}
                size="compact-sm"
                onClick={() => setSelectedMonth(m)}
                fullWidth
              >
                {m}月
              </Button>
            ))}
          </SimpleGrid>
        )}

        {/* 期間選択 */}
        {periodMode === 'range' && (
          <Stack gap="xs">
            <Group justify="center" gap="md">
              <Group gap="xs">
                <Text size="sm">開始月:</Text>
                <Select
                  value={String(startMonth)}
                  onChange={(val) => {
                    const newStart = parseInt(val || '1', 10);
                    setStartMonth(newStart);
                    if (newStart > endMonth) {
                      setEndMonth(newStart);
                    }
                  }}
                  data={months.map(m => ({ value: String(m), label: `${m}月` }))}
                  style={{ width: 80 }}
                  size="sm"
                />
              </Group>
              <Text size="sm">〜</Text>
              <Group gap="xs">
                <Text size="sm">終了月:</Text>
                <Select
                  value={String(endMonth)}
                  onChange={(val) => {
                    const newEnd = parseInt(val || '12', 10);
                    setEndMonth(newEnd);
                    if (newEnd < startMonth) {
                      setStartMonth(newEnd);
                    }
                  }}
                  data={months.map(m => ({ value: String(m), label: `${m}月` }))}
                  style={{ width: 80 }}
                  size="sm"
                />
              </Group>
            </Group>
            <SimpleGrid cols={{ base: 4, sm: 6, md: 12 }} spacing="xs">
              {months.map((m) => {
                const isInRange = m >= startMonth && m <= endMonth;
                const isStart = m === startMonth;
                const isEnd = m === endMonth;
                return (
                  <Button
                    key={m}
                    variant={isInRange ? 'filled' : 'light'}
                    size="compact-sm"
                    onClick={() => {
                      // クリックで範囲を調整
                      if (m < startMonth) {
                        setStartMonth(m);
                      } else if (m > endMonth) {
                        setEndMonth(m);
                      } else if (isStart && isEnd) {
                        // 同じ月の場合はそのまま
                      } else if (isStart) {
                        setStartMonth(m + 1 <= endMonth ? m + 1 : m);
                      } else if (isEnd) {
                        setEndMonth(m - 1 >= startMonth ? m - 1 : m);
                      } else {
                        // 範囲内の月をクリックした場合、そこを終了月に
                        setEndMonth(m);
                      }
                    }}
                    fullWidth
                  >
                    {m}月
                  </Button>
                );
              })}
            </SimpleGrid>
          </Stack>
        )}

        {/* 年間累計の説明 */}
        {periodMode === 'annual' && (
          <Alert color="blue" variant="light" icon={<IconCalendarStats size={16} />}>
            <Text size="sm">
              年間累計を表示中です。貸借対照表は12月末時点の残高、損益計算書は1月〜12月の累計を表示します。
            </Text>
          </Alert>
        )}
      </Paper>

      <SegmentedControl
        value={reportType}
        onChange={setReportType}
        data={[
          { label: 'サマリー', value: 'summary' },
          { label: '貸借対照表', value: 'balance' },
          { label: '損益計算書', value: 'income' },
        ]}
      />

      {reportType === 'summary' && (
        <Stack gap="md">
          {/* サマリーカード */}
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between">
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>総資産</Text>
                    <Skeleton visible={loading} radius="sm">
                      <Text size="xl" fw={700} c={totalAssetsDisplay < 0 ? 'red' : undefined}>¥{formatAmount(totalAssetsDisplay)}</Text>
                    </Skeleton>
                  </div>
                  <ThemeIcon color="blue" size="xl" radius="md">
                    <IconWallet size={24} />
                  </ThemeIcon>
                </Group>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between">
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>総負債</Text>
                    <Skeleton visible={loading} radius="sm">
                      <Text size="xl" fw={700} c={totalLiabilitiesDisplay < 0 ? 'red' : undefined}>¥{formatAmount(totalLiabilitiesDisplay)}</Text>
                    </Skeleton>
                  </div>
                  <ThemeIcon color="red" size="xl" radius="md">
                    <IconBuildingBank size={24} />
                  </ThemeIcon>
                </Group>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between">
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>純資産</Text>
                    <Skeleton visible={loading} radius="sm">
                      <Text size="xl" fw={700} c={totalEquityDisplay < 0 ? 'red' : undefined}>¥{formatAmount(totalEquityDisplay)}</Text>
                    </Skeleton>
                  </div>
                  <ThemeIcon color="green" size="xl" radius="md">
                    <IconPigMoney size={24} />
                  </ThemeIcon>
                </Group>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between">
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                      {periodMode === 'single' ? '当月収支' : '期間収支'}
                    </Text>
                    <Skeleton visible={loading} radius="sm">
                      <Text size="xl" fw={700} c={netIncome >= 0 ? 'green' : 'red'}>
                        ¥{netIncome.toLocaleString()}
                      </Text>
                    </Skeleton>
                  </div>
                  <ThemeIcon color={netIncome >= 0 ? 'green' : 'red'} size="xl" radius="md">
                    {netIncome >= 0 ? <IconTrendingUp size={24} /> : <IconTrendingDown size={24} />}
                  </ThemeIcon>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>

          {/* 収支グラフ */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper p="md" radius="md" withBorder style={{ overflow: 'visible' }}>
                <Title order={4} mb="md">収入内訳</Title>
                {loading ? (
                  <Skeleton height={280} radius="md" />
                ) : revenueChartData.length > 0 ? (
                  <div style={{ padding: '20px 30px 20px 20px' }}>
                    <PieChart
                      data={revenueChartData}
                      withLabelsLine
                      labelsPosition="outside"
                      labelsType="percent"
                      withTooltip
                      tooltipDataSource="segment"
                      h={280}
                      startAngle={90}
                      valueFormatter={tooltipFormatter}
                    />
                  </div>
                ) : (
                  <Text c="dimmed" ta="center" py="xl">収入データがありません</Text>
                )}
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper p="md" radius="md" withBorder style={{ overflow: 'visible' }}>
                <Title order={4} mb="md">支出内訳</Title>
                {loading ? (
                  <Skeleton height={280} radius="md" />
                ) : expenseChartData.length > 0 ? (
                  <div style={{ padding: '20px 30px 20px 20px' }}>
                    <PieChart
                      data={expenseChartData}
                      withLabelsLine
                      labelsPosition="outside"
                      labelsType="percent"
                      withTooltip
                      tooltipDataSource="segment"
                      h={280}
                      startAngle={90}
                      valueFormatter={tooltipFormatter}
                    />
                  </div>
                ) : (
                  <Text c="dimmed" ta="center" py="xl">支出データがありません</Text>
                )}
              </Paper>
            </Grid.Col>
          </Grid>

          {/* トップ5 */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper p="md" radius="md" withBorder>
                <Title order={4} mb="md">収入トップ5</Title>
                {loading ? (
                  <Stack gap="sm">{[...Array(3)].map((_, i) => <Skeleton key={i} height={24} radius="sm" />)}</Stack>
                ) : revenueChartData.length > 0 ? (
                  <Stack gap="sm">
                    {[...revenueChartData]
                      .sort((a, b) => b.value - a.value)
                      .slice(0, 5)
                      .map((item, index) => (
                        <Group key={index} justify="space-between">
                          <Group gap="xs">
                            <Badge color={item.color} size="sm">{index + 1}</Badge>
                            <Text size="sm">{item.name}</Text>
                          </Group>
                          <Text size="sm" fw={500}>¥{item.value.toLocaleString()}</Text>
                        </Group>
                      ))
                    }
                  </Stack>
                ) : (
                  <Text c="dimmed" ta="center" py="xl">収入データがありません</Text>
                )}
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper p="md" radius="md" withBorder>
                <Title order={4} mb="md">支出トップ5</Title>
                {loading ? (
                  <Stack gap="sm">{[...Array(3)].map((_, i) => <Skeleton key={i} height={24} radius="sm" />)}</Stack>
                ) : expenseChartData.length > 0 ? (
                  <Stack gap="sm">
                    {[...expenseChartData]
                      .sort((a, b) => b.value - a.value)
                      .slice(0, 5)
                      .map((item, index) => (
                        <Group key={index} justify="space-between">
                          <Group gap="xs">
                            <Badge color={item.color} size="sm">{index + 1}</Badge>
                            <Text size="sm">{item.name}</Text>
                          </Group>
                          <Text size="sm" fw={500}>¥{item.value.toLocaleString()}</Text>
                        </Group>
                      ))
                    }
                  </Stack>
                ) : (
                  <Text c="dimmed" ta="center" py="xl">支出データがありません</Text>
                )}
              </Paper>
            </Grid.Col>
          </Grid>
        </Stack>
      )}

      {reportType === 'balance' && (
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper p="md" radius="md" withBorder style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box style={{ flex: 1 }}>
                <Title order={4} mb="md">
                  <Group gap="xs">
                    <IconReceipt size={20} />
                    資産の部
                  </Group>
                </Title>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>勘定科目</Table.Th>
                      <Table.Th style={{ textAlign: 'right' }}>金額</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredAssets.flatMap((item, index) => {
                      const rowKey = `assets-${item.name}-${index}`;
                      const hasSubaccounts = !!item.subaccounts && item.subaccounts.length > 0;
                      const visible = isSubaccountVisible(rowKey);

                      const rows = [
                        <Table.Tr key={rowKey}>
                          <Table.Td>
                            <Group gap="xs">
                              {hasSubaccounts && (
                                <Button
                                  variant="subtle"
                                  size="compact-xs"
                                  px={4}
                                  onClick={() => toggleSubaccount(rowKey)}
                                >
                                  {visible ? '▼' : '▶'}
                                </Button>
                              )}
                              <Text>{item.name}</Text>
                            </Group>
                          </Table.Td>
                          <Table.Td style={{ textAlign: 'right' }}>¥{formatAmount(item.amount)}</Table.Td>
                        </Table.Tr>
                      ];

                      if (hasSubaccounts && visible) {
                        item.subaccounts!.forEach((sub, subIndex) => {
                          rows.push(
                            <Table.Tr key={`${rowKey}-sub-${subIndex}`}>
                              <Table.Td style={{ paddingLeft: '2rem', color: 'var(--mantine-color-dimmed)' }}>
                                └ {sub.name}
                              </Table.Td>
                              <Table.Td style={{ textAlign: 'right', color: 'var(--mantine-color-dimmed)' }}>
                                ¥{formatAmount(sub.amount)}
                              </Table.Td>
                            </Table.Tr>
                          );
                        });
                      }

                      return rows;
                    })}
                  </Table.Tbody>
                </Table>
              </Box>
              {/* 資産合計を下部に固定 */}
              <Box mt="auto" pt="md" style={{ borderTop: '2px solid var(--mantine-color-default-border)' }}>
                <Group justify="space-between">
                  <Text fw={700}>資産合計</Text>
                  <Text fw={700}>¥{formatAmount(totalAssetsDisplay)}</Text>
                </Group>
              </Box>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper p="md" radius="md" withBorder style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box style={{ flex: 1 }}>
                <Title order={4} mb="md">
                  <Group gap="xs">
                    <IconBuildingBank size={20} />
                    負債の部
                  </Group>
                </Title>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>勘定科目</Table.Th>
                      <Table.Th style={{ textAlign: 'right' }}>金額</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredLiabilities.flatMap((item, index) => {
                      const rowKey = `liabilities-${item.name}-${index}`;
                      const hasSubaccounts = !!item.subaccounts && item.subaccounts.length > 0;
                      const visible = isSubaccountVisible(rowKey);

                      const rows = [
                        <Table.Tr key={rowKey}>
                          <Table.Td>
                            <Group gap="xs">
                              {hasSubaccounts && (
                                <Button
                                  variant="subtle"
                                  size="compact-xs"
                                  px={4}
                                  onClick={() => toggleSubaccount(rowKey)}
                                >
                                  {visible ? '▼' : '▶'}
                                </Button>
                              )}
                              <Text>{item.name}</Text>
                            </Group>
                          </Table.Td>
                          <Table.Td style={{ textAlign: 'right' }}>¥{formatAmount(item.amount)}</Table.Td>
                        </Table.Tr>
                      ];

                      if (hasSubaccounts && visible) {
                        item.subaccounts!.forEach((sub, subIndex) => {
                          rows.push(
                            <Table.Tr key={`${rowKey}-sub-${subIndex}`}>
                              <Table.Td style={{ paddingLeft: '2rem', color: 'var(--mantine-color-dimmed)' }}>
                                └ {sub.name}
                              </Table.Td>
                              <Table.Td style={{ textAlign: 'right', color: 'var(--mantine-color-dimmed)' }}>
                                ¥{formatAmount(sub.amount)}
                              </Table.Td>
                            </Table.Tr>
                          );
                        });
                      }

                      return rows;
                    })}
                  </Table.Tbody>
                </Table>
                <Group justify="flex-end" mt="xs">
                  <Text size="sm" c="dimmed">負債小計: ¥{formatAmount(totalLiabilitiesDisplay)}</Text>
                </Group>

                <Divider my="md" />

                <Title order={4} mb="md">
                  <Group gap="xs">
                    <IconPigMoney size={20} />
                    純資産の部
                  </Group>
                </Title>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>勘定科目</Table.Th>
                      <Table.Th style={{ textAlign: 'right' }}>金額</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredEquity.flatMap((item, index) => {
                      const rowKey = `equity-${item.name}-${index}`;
                      const hasSubaccounts = !!item.subaccounts && item.subaccounts.length > 0;
                      const visible = isSubaccountVisible(rowKey);

                      const rows = [
                        <Table.Tr key={rowKey}>
                          <Table.Td>
                            <Group gap="xs">
                              {hasSubaccounts && (
                                <Button
                                  variant="subtle"
                                  size="compact-xs"
                                  px={4}
                                  onClick={() => toggleSubaccount(rowKey)}
                                >
                                  {visible ? '▼' : '▶'}
                                </Button>
                              )}
                              <Text>{item.name}</Text>
                            </Group>
                          </Table.Td>
                          <Table.Td style={{ textAlign: 'right' }}>¥{formatAmount(item.amount)}</Table.Td>
                        </Table.Tr>
                      ];

                      if (hasSubaccounts && visible) {
                        item.subaccounts!.forEach((sub, subIndex) => {
                          rows.push(
                            <Table.Tr key={`${rowKey}-sub-${subIndex}`}>
                              <Table.Td style={{ paddingLeft: '2rem', color: 'var(--mantine-color-dimmed)' }}>
                                └ {sub.name}
                              </Table.Td>
                              <Table.Td style={{ textAlign: 'right', color: 'var(--mantine-color-dimmed)' }}>
                                ¥{formatAmount(sub.amount)}
                              </Table.Td>
                            </Table.Tr>
                          );
                        });
                      }

                      return rows;
                    })}
                  </Table.Tbody>
                </Table>
                <Group justify="flex-end" mt="xs">
                  <Text size="sm" c="dimmed">純資産小計: ¥{formatAmount(totalEquityDisplay)}</Text>
                </Group>
              </Box>
              {/* 負債・純資産合計を下部に固定 */}
              <Box mt="auto" pt="md" style={{ borderTop: '2px solid var(--mantine-color-default-border)' }}>
                <Group justify="space-between">
                  <Text fw={700}>負債・純資産合計</Text>
                  <Text fw={700}>¥{formatAmount(totalLiabilitiesDisplay + totalEquityDisplay)}</Text>
                </Group>
              </Box>
            </Paper>
          </Grid.Col>
        </Grid>
      )}

      {reportType === 'income' && (
        <Paper p="md" radius="md" withBorder>
          <Title order={4} mb="md">損益計算書</Title>
          <Stack gap="md">
            {/* 収益セクション */}
            <div>
              <Title order={5} mb="sm" c="green">
                <Group gap="xs">
                  <IconTrendingUp size={18} />
                  収益
                </Group>
              </Title>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>勘定科目</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>金額</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredIncomeData.map((item: { name: string; value: number }, index: number) => (
                    <Table.Tr key={index}>
                      <Table.Td>{item.name}</Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>¥{item.value.toLocaleString()}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
                <Table.Tfoot>
                  <Table.Tr>
                    <Table.Th>収益合計</Table.Th>
                    <Table.Th style={{ textAlign: 'right', color: 'green' }}>¥{totalRevenue.toLocaleString()}</Table.Th>
                  </Table.Tr>
                </Table.Tfoot>
              </Table>
            </div>

            <Divider />

            {/* 費用セクション */}
            <div>
              <Title order={5} mb="sm" c="red">
                <Group gap="xs">
                  <IconTrendingDown size={18} />
                  費用
                </Group>
              </Title>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>勘定科目</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>金額</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredExpenseData.map((item: { name: string; value: number }, index: number) => (
                    <Table.Tr key={index}>
                      <Table.Td>{item.name}</Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>¥{item.value.toLocaleString()}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
                <Table.Tfoot>
                  <Table.Tr>
                    <Table.Th>費用合計</Table.Th>
                    <Table.Th style={{ textAlign: 'right', color: 'red' }}>¥{totalExpenses.toLocaleString()}</Table.Th>
                  </Table.Tr>
                </Table.Tfoot>
              </Table>
            </div>

            <Divider />

            {/* 当期純利益 */}
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Text size="sm" c="dimmed" ta="center">当期純利益</Text>
              <Text size="xl" fw={700} ta="center" c={netIncome >= 0 ? 'green' : 'red'}>
                ¥{netIncome.toLocaleString()}
              </Text>
              <Text size="xs" c="dimmed" ta="center">
                収益 ¥{totalRevenue.toLocaleString()} − 費用 ¥{totalExpenses.toLocaleString()}
              </Text>
            </Card>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
