import { useState, useMemo } from 'react';
import {
  Paper,
  Title,
  Stack,
  Grid,
  Text,
  Group,
  SegmentedControl,
  Table,
  Loader,
  Alert,
  Card,
  ThemeIcon,
  Divider,
  Badge,
  Button,
  SimpleGrid,
  Switch,
  Select
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
  IconChevronRight
} from '@tabler/icons-react';
import { PieChart } from '@mantine/charts';
import { useDashboard } from '../hooks/useDashboard';

export default function Reports() {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [reportType, setReportType] = useState<string>('summary');
  const [hideZeroAccounts, setHideZeroAccounts] = useState<boolean>(false);

  const { data, loading, error } = useDashboard(selectedYear, selectedMonth);

  // 年選択用のオプション
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [
      { value: String(currentYear - 2), label: `${currentYear - 2}年` },
      { value: String(currentYear - 1), label: `${currentYear - 1}年` },
      { value: String(currentYear), label: `${currentYear}年` },
      { value: String(currentYear + 1), label: `${currentYear + 1}年` },
    ];
  }, []);

  // ツールチップフォーマット関数
  const tooltipFormatter = (value: number) => `¥${value.toLocaleString()}`;

  if (loading) {
    return (
      <Stack align="center" justify="center" h="50vh">
        <Loader size="lg" />
        <Text>データを読み込み中...</Text>
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert icon={<IconAlertCircle size="1rem" />} title="エラー" color="red">
        {error}
      </Alert>
    );
  }

  // 貸借対照表データ（0円フィルター適用）
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

  const totalAssets = data?.balanceSheet?.assets?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const totalLiabilities = data?.balanceSheet?.liabilities?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const totalEquity = data?.balanceSheet?.equity?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const totalRevenue = data?.summary?.totalRevenue || 0;
  const totalExpenses = data?.summary?.totalExpenses || 0;
  const netIncome = data?.summary?.netIncome || 0;

  // 損益計算書データ（0円フィルター適用）
  const filteredIncomeData = useMemo(() => {
    const incomeData = data?.incomeData || [];
    return hideZeroAccounts ? incomeData.filter((item: { name: string; value: number }) => item.value !== 0) : incomeData;
  }, [data?.incomeData, hideZeroAccounts]);

  const filteredExpenseData = useMemo(() => {
    const expenseData = data?.expenseData || [];
    return hideZeroAccounts ? expenseData.filter((item: { name: string; value: number }) => item.value !== 0) : expenseData;
  }, [data?.expenseData, hideZeroAccounts]);

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
          <Text fw={600} size="lg">{selectedYear}年{selectedMonth}月</Text>
        </Group>
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
                    <Text size="xl" fw={700}>¥{totalAssets.toLocaleString()}</Text>
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
                    <Text size="xl" fw={700}>¥{totalLiabilities.toLocaleString()}</Text>
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
                    <Text size="xl" fw={700}>¥{totalEquity.toLocaleString()}</Text>
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
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>当月収支</Text>
                    <Text size="xl" fw={700} c={netIncome >= 0 ? 'green' : 'red'}>
                      ¥{netIncome.toLocaleString()}
                    </Text>
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
              <Paper p="md" radius="md" withBorder>
                <Title order={4} mb="md">収入内訳</Title>
                {revenueChartData.length > 0 ? (
                  <PieChart
                    data={revenueChartData}
                    withLabelsLine
                    labelsPosition="outside"
                    labelsType="percent"
                    withTooltip
                    tooltipDataSource="segment"
                    h={250}
                    startAngle={90}
                    valueFormatter={tooltipFormatter}
                  />
                ) : (
                  <Text c="dimmed" ta="center" py="xl">収入データがありません</Text>
                )}
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper p="md" radius="md" withBorder>
                <Title order={4} mb="md">支出内訳</Title>
                {expenseChartData.length > 0 ? (
                  <PieChart
                    data={expenseChartData}
                    withLabelsLine
                    labelsPosition="outside"
                    labelsType="percent"
                    withTooltip
                    tooltipDataSource="segment"
                    h={250}
                    startAngle={90}
                    valueFormatter={tooltipFormatter}
                  />
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
                {revenueChartData.length > 0 ? (
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
                {expenseChartData.length > 0 ? (
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
            <Paper p="md" radius="md" withBorder>
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
                  {filteredAssets.map((item, index) => (
                    <Table.Tr key={index}>
                      <Table.Td>{item.name}</Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>¥{item.amount.toLocaleString()}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
                <Table.Tfoot>
                  <Table.Tr>
                    <Table.Th>資産合計</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>¥{totalAssets.toLocaleString()}</Table.Th>
                  </Table.Tr>
                </Table.Tfoot>
              </Table>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper p="md" radius="md" withBorder>
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
                  {filteredLiabilities.map((item, index) => (
                    <Table.Tr key={index}>
                      <Table.Td>{item.name}</Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>¥{item.amount.toLocaleString()}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
                <Table.Tfoot>
                  <Table.Tr>
                    <Table.Th>負債合計</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>¥{totalLiabilities.toLocaleString()}</Table.Th>
                  </Table.Tr>
                </Table.Tfoot>
              </Table>

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
                  {filteredEquity.map((item, index) => (
                    <Table.Tr key={index}>
                      <Table.Td>{item.name}</Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>¥{item.amount.toLocaleString()}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
                <Table.Tfoot>
                  <Table.Tr>
                    <Table.Th>純資産合計</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>¥{totalEquity.toLocaleString()}</Table.Th>
                  </Table.Tr>
                </Table.Tfoot>
              </Table>

              <Divider my="md" />

              <Group justify="space-between">
                <Text fw={700}>負債・純資産合計</Text>
                <Text fw={700}>¥{(totalLiabilities + totalEquity).toLocaleString()}</Text>
              </Group>
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
