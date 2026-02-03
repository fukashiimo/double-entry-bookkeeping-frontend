import { useState } from 'react';
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
  Badge
} from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
import {
  IconAlertCircle,
  IconTrendingUp,
  IconTrendingDown,
  IconWallet,
  IconReceipt,
  IconPigMoney,
  IconBuildingBank
} from '@tabler/icons-react';
import { PieChart } from '@mantine/charts';
import { useDashboard } from '../hooks/useDashboard';

export default function Reports() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reportType, setReportType] = useState<string>('summary');

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1;

  const { data, loading, error } = useDashboard(year, month);

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

  const totalAssets = data?.balanceSheet?.assets?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const totalLiabilities = data?.balanceSheet?.liabilities?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const totalEquity = data?.balanceSheet?.equity?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const totalRevenue = data?.incomeStatement?.revenue?.reduce((sum, item) => sum + item.value, 0) || 0;
  const totalExpenses = data?.incomeStatement?.expenses?.reduce((sum, item) => sum + item.value, 0) || 0;
  const netIncome = totalRevenue - totalExpenses;

  // 円グラフ用データ
  const expenseChartData = (data?.incomeStatement?.expenses || [])
    .filter(item => item.value > 0)
    .map((item, index) => ({
      name: item.name,
      value: item.value,
      color: ['red.6', 'orange.6', 'yellow.6', 'teal.6', 'blue.6', 'violet.6', 'pink.6'][index % 7]
    }));

  const revenueChartData = (data?.incomeStatement?.revenue || [])
    .filter(item => item.value > 0)
    .map((item, index) => ({
      name: item.name,
      value: item.value,
      color: ['green.6', 'teal.6', 'cyan.6', 'blue.6', 'indigo.6'][index % 5]
    }));

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>財務レポート</Title>
        <Group>
          <MonthPickerInput
            value={selectedDate}
            onChange={(date) => date && setSelectedDate(date)}
            placeholder="月を選択"
            style={{ width: 150 }}
          />
        </Group>
      </Group>

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
                  />
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
                  {(data?.balanceSheet?.assets || []).map((item, index) => (
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
                  {(data?.balanceSheet?.liabilities || []).map((item, index) => (
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
                  {(data?.balanceSheet?.equity || []).map((item, index) => (
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

              {totalAssets === totalLiabilities + totalEquity ? (
                <Badge color="green" mt="sm">バランスシート一致</Badge>
              ) : (
                <Badge color="red" mt="sm">バランスシート不一致</Badge>
              )}
            </Paper>
          </Grid.Col>
        </Grid>
      )}

      {reportType === 'income' && (
        <Paper p="md" radius="md" withBorder>
          <Title order={4} mb="md">損益計算書</Title>
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
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
                  {(data?.incomeStatement?.revenue || []).map((item, index) => (
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
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
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
                  {(data?.incomeStatement?.expenses || []).map((item, index) => (
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
            </Grid.Col>
          </Grid>

          <Divider my="md" />

          <Group justify="center">
            <Card shadow="sm" padding="lg" radius="md" withBorder style={{ minWidth: 300 }}>
              <Text size="sm" c="dimmed" ta="center">当期純利益</Text>
              <Text size="xl" fw={700} ta="center" c={netIncome >= 0 ? 'green' : 'red'}>
                ¥{netIncome.toLocaleString()}
              </Text>
              <Text size="xs" c="dimmed" ta="center">
                収益 ¥{totalRevenue.toLocaleString()} − 費用 ¥{totalExpenses.toLocaleString()}
              </Text>
            </Card>
          </Group>
        </Paper>
      )}
    </Stack>
  );
}
