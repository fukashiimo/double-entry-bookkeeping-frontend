import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Paper, Title, Stack, Grid, Text, Group, SegmentedControl,
  Table, Alert, Card, ThemeIcon, Divider, Button, Loader, Center,
  Switch, Select, Box, useMantineTheme,
} from '@mantine/core';
import {
  IconAlertCircle, IconTrendingUp, IconTrendingDown, IconWallet,
  IconPigMoney, IconBuildingBank, IconChevronLeft, IconChevronRight,
  IconCalendarStats,
} from '@tabler/icons-react';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useDashboard } from '../hooks/useDashboard';
import { useJournalEntries } from '../hooks/useJournalEntries';

export default function Reports() {
  const currentYear = new Date().getFullYear();
  const [searchParams] = useSearchParams();
  const urlYear = searchParams.get('year');
  const urlMonth = searchParams.get('month');
  const navigate = useNavigate();

  // URLパラメータがある場合はその値を使い、ない場合は仕訳データ取得後に確定
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    if (urlYear) return parseInt(urlYear, 10);
    return currentYear; // 一時値（isInitializedがfalseの間はLoader表示）
  });
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    if (urlMonth) return parseInt(urlMonth, 10);
    return 1; // 一時値（isInitializedがfalseの間はLoader表示）
  });
  const [reportType, setReportType] = useState<string>('summary');
  const [hideZeroAccounts, setHideZeroAccounts] = useState<boolean>(
    () => localStorage.getItem('bs-hide-zero-accounts') === 'true'
  );
  const [showAllSubaccounts, setShowAllSubaccounts] = useState<boolean>(
    () => localStorage.getItem('bs-show-all-subaccounts') === 'true'
  );
  const [expandedSubaccounts, setExpandedSubaccounts] = useState<Record<string, boolean>>({});
  const [isInitialized, setIsInitialized] = useState<boolean>(!!urlYear && !!urlMonth);
  const [periodMode, setPeriodMode] = useState<'single' | 'range' | 'annual'>('single');
  const [startMonth, setStartMonth] = useState<number>(1);
  const [endMonth, setEndMonth] = useState<number>(12);

  const { journalEntries, loading: journalEntriesLoading } = useJournalEntries();
  const theme = useMantineTheme();

  // 表示設定を localStorage に永続化
  useEffect(() => { localStorage.setItem('bs-hide-zero-accounts', String(hideZeroAccounts)); }, [hideZeroAccounts]);
  useEffect(() => { localStorage.setItem('bs-show-all-subaccounts', String(showAllSubaccounts)); }, [showAllSubaccounts]);

  // 初期表示月：URLパラメータがなければ仕訳データ取得後に最新月を確定する
  useEffect(() => {
    if (isInitialized) return;
    if (journalEntriesLoading) return; // まだ読み込み中

    if (journalEntries && journalEntries.length > 0) {
      const sortedEntries = [...journalEntries].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const lastEntryDate = new Date(sortedEntries[0].date);
      setSelectedYear(lastEntryDate.getFullYear());
      setSelectedMonth(lastEntryDate.getMonth() + 1);
    } else {
      // 仕訳が0件 → 現在月
      setSelectedYear(currentYear);
      setSelectedMonth(new Date().getMonth() + 1);
    }
    setIsInitialized(true);
  }, [journalEntries, journalEntriesLoading, isInitialized, currentYear]);

  const dashboardOptions = useMemo(() => ({
    periodMode,
    startMonth,
    endMonth,
  }), [periodMode, startMonth, endMonth]);

  const { data, loading, error } = useDashboard(selectedYear, selectedMonth, dashboardOptions);

  const yearOptions = useMemo(() => [
    { value: String(currentYear + 1), label: `${currentYear + 1}年` },
    { value: String(currentYear), label: `${currentYear}年` },
    { value: String(currentYear - 1), label: `${currentYear - 1}年` },
    { value: String(currentYear - 2), label: `${currentYear - 2}年` },
  ], [currentYear]);

  // 0円フィルター
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

  const filteredIncomeData = useMemo(() => {
    const incomeData = data?.incomeData || [];
    return hideZeroAccounts ? incomeData.filter((item: { name: string; value: number }) => item.value !== 0) : incomeData;
  }, [data?.incomeData, hideZeroAccounts]);

  const filteredExpenseData = useMemo(() => {
    const expenseData = data?.expenseData || [];
    return hideZeroAccounts ? expenseData.filter((item: { name: string; value: number }) => item.value !== 0) : expenseData;
  }, [data?.expenseData, hideZeroAccounts]);

  // 初期表示月が確定するまではローダーを表示（誤った月を一瞬でも描画しない）
  if (!isInitialized) {
    return (
      <Center style={{ minHeight: 300 }}>
        <Stack align="center" gap="sm">
          <Loader size="md" />
          <Text size="sm" c="dimmed">表示月を確認中...</Text>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <Alert icon={<IconAlertCircle size="1rem" />} title="エラー" color="red">{error}</Alert>
    );
  }

  const totalAssets = data?.balanceSheet?.assets?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const totalLiabilities = data?.balanceSheet?.liabilities?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const totalEquity = data?.balanceSheet?.equity?.reduce((sum, item) => sum + item.amount, 0) || 0;

  // マイナス残高を△表記（日本の会計慣行）
  const formatAmount = (amount: number) =>
    amount < 0 ? `△${Math.abs(amount).toLocaleString()}` : amount.toLocaleString();

  const totalRevenue = data?.summary?.totalRevenue || 0;
  const totalExpenses = data?.summary?.totalExpenses || 0;
  const netIncome = data?.summary?.netIncome || 0;

  const expenseChartData = (data?.expenseData || [])
    .filter((item: { name: string; value: number }) => item.value > 0)
    .sort((a: { name: string; value: number }, b: { name: string; value: number }) => b.value - a.value)
    .map((item: { name: string; value: number }, index: number) => ({
      name: item.name,
      value: item.value,
      color: ['red.6', 'orange.6', 'yellow.6', 'teal.6', 'blue.6', 'violet.6', 'pink.6'][index % 7],
    }));

  const revenueChartData = (data?.incomeData || [])
    .filter((item: { name: string; value: number }) => item.value > 0)
    .sort((a: { name: string; value: number }, b: { name: string; value: number }) => b.value - a.value)
    .map((item: { name: string; value: number }, index: number) => ({
      name: item.name,
      value: item.value,
      color: ['green.6', 'teal.6', 'cyan.6', 'blue.6', 'indigo.6'][index % 5],
    }));

  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const isSubaccountVisible = (key: string) => showAllSubaccounts || !!expandedSubaccounts[key];
  const toggleSubaccount = (key: string) => {
    setExpandedSubaccounts(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── 仕訳帳へ遷移 ───────────────────────────────────────────────────────
  const navigateToJournalList = (accountName: string) => {
    let startDate: Date, endDate: Date;
    if (periodMode === 'single') {
      startDate = new Date(selectedYear, selectedMonth - 1, 1);
      endDate = new Date(selectedYear, selectedMonth, 0);
    } else if (periodMode === 'range') {
      startDate = new Date(selectedYear, startMonth - 1, 1);
      endDate = new Date(selectedYear, endMonth, 0);
    } else {
      startDate = new Date(selectedYear, 0, 1);
      endDate = new Date(selectedYear, 11, 31);
    }
    navigate('/journal-list', { state: { startDate, endDate, accountFilter: accountName } });
  };

  // ─── クリック可能な勘定科目スタイル ──────────────────────────────────────
  const accountNameStyle: React.CSSProperties = {
    cursor: 'pointer',
    padding: '2px 6px',
    borderRadius: 4,
    display: 'inline-block',
  };
  const handleAccountHoverEnter = (e: React.MouseEvent<HTMLElement>) => {
    (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--mantine-color-gray-1)';
  };
  const handleAccountHoverLeave = (e: React.MouseEvent<HTMLElement>) => {
    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
  };

  // Mantine カラー文字列（例: 'red.6'）を実際の CSS 色に変換
  const getChartColor = (colorStr: string) => {
    const [name, shade] = colorStr.split('.');
    return theme.colors[name as keyof typeof theme.colors]?.[parseInt(shade)] ?? '#888';
  };

  // ─── カスタムツールチップ（勘定科目名が改行されないよう固定幅）───────────
  const renderTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const item = payload[0];
    return (
      <Paper p="xs" shadow="sm" withBorder style={{ whiteSpace: 'nowrap', minWidth: 140 }}>
        <Text size="sm">{String(item.name ?? '')}</Text>
        <Text size="sm" fw={600}>¥{Number(item.value ?? 0).toLocaleString()}</Text>
        <Text size="xs" c="dimmed" mt={2}>クリックで仕訳帳を表示</Text>
      </Paper>
    );
  };

  // ─── トップ5リスト（サマリー用）───────────────────────────────────────────
  const renderTop5 = (
    chartData: Array<{ name: string; value: number; color: string }>,
    total: number,
    label: string,
  ) => (
    <Stack gap={6}>
      <Text size="sm" fw={600} mb={2}>{label}</Text>
      {chartData.slice(0, 5).map((item, index) => {
        const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0';
        const cssColor = `var(--mantine-color-${item.color.replace('.', '-')})`;
        return (
          <div
            key={index}
            onClick={() => navigateToJournalList(item.name)}
            style={{ cursor: 'pointer', padding: '5px 8px', borderRadius: 4, transition: 'background 0.1s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--mantine-color-gray-0)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
          >
            <Group justify="space-between" wrap="nowrap" gap="xs">
              <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
                <Text size="xs" c="dimmed" style={{ width: 14, textAlign: 'center', flexShrink: 0 }}>{index + 1}</Text>
                <div style={{ width: 10, height: 10, borderRadius: 2, flexShrink: 0, backgroundColor: cssColor }} />
                <Text size="sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.name}
                </Text>
              </Group>
              <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
                <Text size="sm" fw={500} style={{ whiteSpace: 'nowrap' }}>¥{item.value.toLocaleString()}</Text>
                <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap', width: 46, textAlign: 'right' }}>{pct}%</Text>
              </Group>
            </Group>
          </div>
        );
      })}
      <Divider mt={2} />
      <Group justify="space-between" px={8}>
        <Text size="sm" fw={600}>合計</Text>
        <Text size="sm" fw={600}>¥{total.toLocaleString()}</Text>
      </Group>
    </Stack>
  );

  // ─── 貸借対照表の科目行 ──────────────────────────────────────────────────
  const renderAccountRows = (
    items: Array<{ name: string; amount: number; subaccounts?: Array<{ name: string; amount: number }> }>,
    prefix: string,
  ) =>
    items.flatMap((item, index) => {
      const rowKey = `${prefix}-${item.name}-${index}`;
      const hasSubaccounts = !!item.subaccounts && item.subaccounts.length > 0;
      const visible = isSubaccountVisible(rowKey);

      const rows: React.ReactNode[] = [
        <Table.Tr key={rowKey}>
          <Table.Td>
            <Group gap="xs">
              {hasSubaccounts && (
                <Button variant="subtle" size="compact-xs" px={4} onClick={() => toggleSubaccount(rowKey)}>
                  {visible ? '▼' : '▶'}
                </Button>
              )}
              <span
                style={accountNameStyle}
                onClick={() => navigateToJournalList(item.name)}
                onMouseEnter={handleAccountHoverEnter}
                onMouseLeave={handleAccountHoverLeave}
              >
                {item.name}
              </span>
            </Group>
          </Table.Td>
          <Table.Td style={{ textAlign: 'right' }}>{formatAmount(item.amount)}</Table.Td>
        </Table.Tr>,
      ];

      if (hasSubaccounts && visible) {
        item.subaccounts!.forEach((sub, subIndex) => {
          rows.push(
            <Table.Tr key={`${rowKey}-sub-${subIndex}`}>
              <Table.Td style={{ paddingLeft: '2rem', color: 'var(--mantine-color-dimmed)' }}>└ {sub.name}</Table.Td>
              <Table.Td style={{ textAlign: 'right', color: 'var(--mantine-color-dimmed)' }}>{formatAmount(sub.amount)}</Table.Td>
            </Table.Tr>
          );
        });
      }

      return rows;
    });

  // ─── 損益計算書の科目行 ──────────────────────────────────────────────────
  const renderIncomeRow = (item: { name: string; value: number }, index: number) => (
    <Table.Tr key={index}>
      <Table.Td style={{ paddingLeft: '2rem' }}>
        <span
          style={accountNameStyle}
          onClick={() => navigateToJournalList(item.name)}
          onMouseEnter={handleAccountHoverEnter}
          onMouseLeave={handleAccountHoverLeave}
        >
          {item.name}
        </span>
      </Table.Td>
      <Table.Td style={{ textAlign: 'right' }}>{item.value.toLocaleString()}</Table.Td>
    </Table.Tr>
  );

  return (
    <Stack gap="md">
      {/* 年・月選択（期間モード＋スイッチをまとめてコンパクトに） */}
      <Paper p="md" radius="md" withBorder>
        <Group justify="space-between" mb="sm" wrap="wrap" gap="xs">
          <Group gap="xs">
            <Button variant="subtle" size="compact-sm" leftSection={<IconChevronLeft size={14} />} onClick={() => setSelectedYear(y => y - 1)}>前年</Button>
            <Select value={String(selectedYear)} onChange={(val) => val && setSelectedYear(parseInt(val, 10))} data={yearOptions} style={{ width: 90 }} size="sm" />
            <Button variant="subtle" size="compact-sm" rightSection={<IconChevronRight size={14} />} onClick={() => setSelectedYear(y => y + 1)}>翌年</Button>
          </Group>
          <Group gap="sm" wrap="wrap">
            <SegmentedControl
              value={periodMode}
              onChange={(value) => {
                setPeriodMode(value as 'single' | 'range' | 'annual');
                if (value === 'annual') { setStartMonth(1); setEndMonth(12); }
              }}
              data={[{ label: '単月', value: 'single' }, { label: '期間選択', value: 'range' }, { label: '年間累計', value: 'annual' }]}
              size="xs"
            />
            <Switch label="0円非表示" checked={hideZeroAccounts} onChange={(e) => setHideZeroAccounts(e.currentTarget.checked)} size="sm" />
            <Switch label="補助科目を全表示" checked={showAllSubaccounts} onChange={(e) => setShowAllSubaccounts(e.currentTarget.checked)} size="sm" />
          </Group>
        </Group>

        {periodMode === 'single' && (
          <Group gap={4} wrap="wrap">
            {months.map((m) => (
              <Button key={m} variant={selectedMonth === m ? 'filled' : 'default'} size="xs" px={8} style={{ minWidth: 28 }} onClick={() => setSelectedMonth(m)}>{m}</Button>
            ))}
          </Group>
        )}

        {periodMode === 'range' && (
          <Stack gap="xs">
            <Group gap="md">
              <Group gap="xs">
                <Text size="sm">開始月:</Text>
                <Select value={String(startMonth)} onChange={(val) => { const n = parseInt(val || '1', 10); setStartMonth(n); if (n > endMonth) setEndMonth(n); }} data={months.map(m => ({ value: String(m), label: `${m}月` }))} style={{ width: 80 }} size="sm" />
              </Group>
              <Text size="sm">〜</Text>
              <Group gap="xs">
                <Text size="sm">終了月:</Text>
                <Select value={String(endMonth)} onChange={(val) => { const n = parseInt(val || '12', 10); setEndMonth(n); if (n < startMonth) setStartMonth(n); }} data={months.map(m => ({ value: String(m), label: `${m}月` }))} style={{ width: 80 }} size="sm" />
              </Group>
            </Group>
            <Group gap={4} wrap="wrap">
              {months.map((m) => {
                const isInRange = m >= startMonth && m <= endMonth;
                const isStart = m === startMonth;
                const isEnd = m === endMonth;
                return (
                  <Button key={m} variant={isInRange ? 'filled' : 'default'} size="xs" px={8} style={{ minWidth: 28 }}
                    onClick={() => {
                      if (m < startMonth) setStartMonth(m);
                      else if (m > endMonth) setEndMonth(m);
                      else if (isStart && isEnd) {}
                      else if (isStart) setStartMonth(m + 1 <= endMonth ? m + 1 : m);
                      else if (isEnd) setEndMonth(m - 1 >= startMonth ? m - 1 : m);
                      else setEndMonth(m);
                    }}
                  >{m}</Button>
                );
              })}
            </Group>
          </Stack>
        )}

        {periodMode === 'annual' && (
          <Alert color="blue" variant="light" icon={<IconCalendarStats size={16} />}>
            <Text size="sm">年間累計を表示中です。貸借対照表は12月末時点の残高、損益計算書は1月〜12月の累計を表示します。</Text>
          </Alert>
        )}

        {/* 対象期間表示 */}
        <Box>
          <Text size="sm" c="dimmed">
            {(() => {
              const pad2 = (n: number) => String(n).padStart(2, '0');
              const lastDay = (y: number, m: number) => new Date(y, m, 0).getDate();
              const fmt = (y: number, m: number, d: number) => `${y}年${pad2(m)}月${pad2(d)}日`;
              if (periodMode === 'single') {
                return `対象期間：${fmt(selectedYear, selectedMonth, 1)} ～ ${fmt(selectedYear, selectedMonth, lastDay(selectedYear, selectedMonth))}`;
              } else if (periodMode === 'range') {
                return `対象期間：${fmt(selectedYear, startMonth, 1)} ～ ${fmt(selectedYear, endMonth, lastDay(selectedYear, endMonth))}`;
              } else {
                return `対象期間：${fmt(selectedYear, 1, 1)} ～ ${fmt(selectedYear, 12, 31)}`;
              }
            })()}
          </Text>
        </Box>
      </Paper>

      <SegmentedControl
        value={reportType}
        onChange={setReportType}
        data={[{ label: 'サマリー', value: 'summary' }, { label: '貸借対照表', value: 'balance' }, { label: '損益計算書', value: 'income' }]}
      />

      {/* ─── サマリー ────────────────────────────────────────────────────── */}
      {reportType === 'summary' && (
        <Stack gap="md">
          {/* サマリーカード */}
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between">
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>総資産</Text>
                    <Text size="xl" fw={700} c={totalAssets < 0 ? 'red' : undefined}>¥{formatAmount(totalAssets)}</Text>
                  </div>
                  <ThemeIcon color="blue" size="xl" radius="md"><IconWallet size={24} /></ThemeIcon>
                </Group>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between">
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>総負債</Text>
                    <Text size="xl" fw={700} c={totalLiabilities < 0 ? 'red' : undefined}>¥{formatAmount(totalLiabilities)}</Text>
                  </div>
                  <ThemeIcon color="red" size="xl" radius="md"><IconBuildingBank size={24} /></ThemeIcon>
                </Group>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between">
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>純資産</Text>
                    <Text size="xl" fw={700} c={totalEquity < 0 ? 'red' : undefined}>¥{formatAmount(totalEquity)}</Text>
                  </div>
                  <ThemeIcon color="green" size="xl" radius="md"><IconPigMoney size={24} /></ThemeIcon>
                </Group>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between">
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{periodMode === 'single' ? '当月収支' : '期間収支'}</Text>
                    <Text size="xl" fw={700} c={netIncome >= 0 ? 'green' : 'red'}>¥{netIncome.toLocaleString()}</Text>
                  </div>
                  <ThemeIcon color={netIncome >= 0 ? 'green' : 'red'} size="xl" radius="md">
                    {netIncome >= 0 ? <IconTrendingUp size={24} /> : <IconTrendingDown size={24} />}
                  </ThemeIcon>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>

          {/* 収益内訳・費用内訳（円グラフ＋トップ5統合） */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper p="md" radius="md" withBorder style={{ overflow: 'visible' }}>
                <Title order={4} mb="md">収益内訳</Title>
                {loading && !data ? (
                  <Group justify="center" py="xl"><Loader size="sm" /></Group>
                ) : revenueChartData.length > 0 ? (
                  <Grid align="center">
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <ResponsiveContainer width="100%" height={200}>
                        <RechartsPieChart>
                          <Pie
                            data={revenueChartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%" cy="50%"
                            outerRadius={80}
                            startAngle={90}
                            endAngle={-270}
                            onClick={(entry) => navigateToJournalList(entry.name)}
                            style={{ cursor: 'pointer' }}
                          >
                            {revenueChartData.map((entry, index) => (
                              <Cell key={index} fill={getChartColor(entry.color)} />
                            ))}
                          </Pie>
                          <RechartsTooltip content={renderTooltip} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      {renderTop5(revenueChartData, totalRevenue, '収益トップ5')}
                    </Grid.Col>
                  </Grid>
                ) : (data?.incomeData || []).some((item: { value: number }) => item.value !== 0) ? (
                  <Text c="dimmed" ta="center" py="xl">表示対象の正の金額がありません</Text>
                ) : (
                  <Text c="dimmed" ta="center" py="xl">収益データがありません</Text>
                )}
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper p="md" radius="md" withBorder style={{ overflow: 'visible' }}>
                <Title order={4} mb="md">費用内訳</Title>
                {loading && !data ? (
                  <Group justify="center" py="xl"><Loader size="sm" /></Group>
                ) : expenseChartData.length > 0 ? (
                  <Grid align="center">
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <ResponsiveContainer width="100%" height={200}>
                        <RechartsPieChart>
                          <Pie
                            data={expenseChartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%" cy="50%"
                            outerRadius={80}
                            startAngle={90}
                            endAngle={-270}
                            onClick={(entry) => navigateToJournalList(entry.name)}
                            style={{ cursor: 'pointer' }}
                          >
                            {expenseChartData.map((entry, index) => (
                              <Cell key={index} fill={getChartColor(entry.color)} />
                            ))}
                          </Pie>
                          <RechartsTooltip content={renderTooltip} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      {renderTop5(expenseChartData, totalExpenses, '費用トップ5')}
                    </Grid.Col>
                  </Grid>
                ) : (data?.expenseData || []).some((item: { value: number }) => item.value !== 0) ? (
                  <Text c="dimmed" ta="center" py="xl">表示対象の正の金額がありません</Text>
                ) : (
                  <Text c="dimmed" ta="center" py="xl">費用データがありません</Text>
                )}
              </Paper>
            </Grid.Col>
          </Grid>
        </Stack>
      )}

      {/* ─── 貸借対照表 ───────────────────────────────────────────────────── */}
      {reportType === 'balance' && (
        <Grid>
          {/* 資産の部 */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper p="md" radius="md" withBorder style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box style={{ flex: 1 }}>
                <Title order={4} mb="md" ta="center">資産の部</Title>
                <Table withColumnBorders horizontalSpacing="sm">
                  <colgroup>
                    <col style={{ width: '65%' }} />
                    <col style={{ width: '35%' }} />
                  </colgroup>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ textAlign: 'center' }}>勘定科目</Table.Th>
                      <Table.Th style={{ textAlign: 'center' }}>金額</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {renderAccountRows(filteredAssets, 'assets')}
                  </Table.Tbody>
                </Table>
              </Box>
              <Box mt="auto" pt="md" style={{ borderTop: '2px solid var(--mantine-color-default-border)' }}>
                <Group justify="space-between">
                  <Text fw={700}>資産合計</Text>
                  <Text fw={700}>{formatAmount(totalAssets)}</Text>
                </Group>
              </Box>
            </Paper>
          </Grid.Col>

          {/* 負債の部 ＋ 純資産の部 */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper p="md" radius="md" withBorder style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box style={{ flex: 1 }}>
                {/* 負債の部 ＋（単位：円） */}
                <Box style={{ position: 'relative', textAlign: 'center', marginBottom: 16 }}>
                  <Title order={4}>負債の部</Title>
                  <Text size="xs" c="dimmed" style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}>（単位：円）</Text>
                </Box>
                <Table withColumnBorders horizontalSpacing="sm">
                  <colgroup>
                    <col style={{ width: '65%' }} />
                    <col style={{ width: '35%' }} />
                  </colgroup>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ textAlign: 'center' }}>勘定科目</Table.Th>
                      <Table.Th style={{ textAlign: 'center' }}>金額</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {renderAccountRows(filteredLiabilities, 'liabilities')}
                  </Table.Tbody>
                  <Table.Tfoot>
                    <Table.Tr>
                      <Table.Th style={{ fontWeight: 700, borderTop: '2px solid var(--mantine-color-default-border)', paddingTop: 8 }}>負債合計</Table.Th>
                      <Table.Th style={{ textAlign: 'right', fontWeight: 700, borderTop: '2px solid var(--mantine-color-default-border)', paddingTop: 8 }}>{formatAmount(totalLiabilities)}</Table.Th>
                    </Table.Tr>
                  </Table.Tfoot>
                </Table>

                <Divider my="md" />

                {/* 純資産の部（列見出しなし） */}
                <Title order={4} mb="md" ta="center">純資産の部</Title>
                <Table withColumnBorders horizontalSpacing="sm">
                  <colgroup>
                    <col style={{ width: '65%' }} />
                    <col style={{ width: '35%' }} />
                  </colgroup>
                  <Table.Tbody>
                    {renderAccountRows(filteredEquity, 'equity')}
                  </Table.Tbody>
                  <Table.Tfoot>
                    <Table.Tr>
                      <Table.Th style={{ fontWeight: 700, borderTop: '2px solid var(--mantine-color-default-border)', paddingTop: 8 }}>純資産合計</Table.Th>
                      <Table.Th style={{ textAlign: 'right', fontWeight: 700, borderTop: '2px solid var(--mantine-color-default-border)', paddingTop: 8 }}>{formatAmount(totalEquity)}</Table.Th>
                    </Table.Tr>
                  </Table.Tfoot>
                </Table>
              </Box>

              <Box mt="auto" pt="md" style={{ borderTop: '2px solid var(--mantine-color-default-border)' }}>
                <Group justify="space-between">
                  <Text fw={700}>負債・純資産合計</Text>
                  <Text fw={700}>{formatAmount(totalLiabilities + totalEquity)}</Text>
                </Group>
              </Box>
            </Paper>
          </Grid.Col>
        </Grid>
      )}

      {/* ─── 損益計算書 ───────────────────────────────────────────────────── */}
      {reportType === 'income' && (
        <Box mx="auto" style={{ maxWidth: 560, width: '100%' }}>
          <Paper p="md" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={4}>損益計算書</Title>
              <Text size="xs" c="dimmed">（単位：円）</Text>
            </Group>

            <Table withColumnBorders horizontalSpacing="sm">
              <colgroup>
                <col style={{ width: '65%' }} />
                <col style={{ width: '35%' }} />
              </colgroup>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ textAlign: 'center' }}>勘定科目</Table.Th>
                  <Table.Th style={{ textAlign: 'center' }}>金額</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {/* 収益 */}
                <Table.Tr>
                  <Table.Td colSpan={2} style={{ fontWeight: 700, paddingTop: 12, paddingBottom: 4 }}>収益</Table.Td>
                </Table.Tr>
                {filteredIncomeData.map(renderIncomeRow)}
                <Table.Tr style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
                  <Table.Td style={{ fontWeight: 700, paddingTop: 6 }}>収益合計</Table.Td>
                  <Table.Td style={{ textAlign: 'right', fontWeight: 700, paddingTop: 6, color: 'var(--mantine-color-green-7)' }}>
                    {totalRevenue.toLocaleString()}
                  </Table.Td>
                </Table.Tr>

                {/* 空白行 */}
                <Table.Tr><Table.Td colSpan={2} style={{ height: 12, padding: 0, border: 'none' }} /></Table.Tr>

                {/* 費用 */}
                <Table.Tr>
                  <Table.Td colSpan={2} style={{ fontWeight: 700, paddingBottom: 4 }}>費用</Table.Td>
                </Table.Tr>
                {filteredExpenseData.map(renderIncomeRow)}
                <Table.Tr style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
                  <Table.Td style={{ fontWeight: 700, paddingTop: 6 }}>費用合計</Table.Td>
                  <Table.Td style={{ textAlign: 'right', fontWeight: 700, paddingTop: 6, color: 'var(--mantine-color-red-7)' }}>
                    {totalExpenses.toLocaleString()}
                  </Table.Td>
                </Table.Tr>

                {/* 当月利益 */}
                <Table.Tr style={{ borderTop: '2px solid var(--mantine-color-default-border)' }}>
                  <Table.Td style={{ fontWeight: 700, fontSize: '1rem', paddingTop: 10 }}>当月利益</Table.Td>
                  <Table.Td style={{
                    textAlign: 'right', fontWeight: 700, fontSize: '1rem', paddingTop: 10,
                    color: netIncome >= 0 ? 'var(--mantine-color-green-7)' : 'var(--mantine-color-red-7)',
                  }}>
                    {netIncome.toLocaleString()}
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Paper>
        </Box>
      )}
    </Stack>
  );
}
