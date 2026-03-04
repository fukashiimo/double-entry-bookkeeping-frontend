import { useState, useMemo } from 'react';
import {
  Table,
  Paper,
  Title,
  Group,
  Button,
  TextInput,
  Stack,
  Pagination,
  Menu,
  ActionIcon,
  Text,
  Select,
  Grid,
  Loader,
  Alert,
  UnstyledButton,
  Center
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import {
  IconSearch,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconDownload,
  IconPlus,
  IconFilter,
  IconAlertCircle,
  IconChevronUp,
  IconChevronDown,
  IconSelector
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useJournalEntries } from '../hooks/useJournalEntries';
import { useAccounts } from '../hooks/useAccounts';

interface JournalListProps {
  onEdit: (data: {
    id: number;
    date: string;
    description: string;
    debit_account_name: string;
    credit_account_name: string;
    amount: number;
  }) => void;
}

type SortField = 'date' | 'amount' | 'description' | null;
type SortDirection = 'asc' | 'desc';

// ソート可能なヘッダーコンポーネント
interface ThProps {
  children: React.ReactNode;
  sorted: boolean;
  reversed: boolean;
  onSort: () => void;
  width?: string;
  textAlign?: 'left' | 'right' | 'center';
}

function Th({ children, sorted, reversed, onSort, width, textAlign = 'left' }: ThProps) {
  const Icon = sorted ? (reversed ? IconChevronUp : IconChevronDown) : IconSelector;
  return (
    <Table.Th style={{ width, textAlign }}>
      <UnstyledButton onClick={onSort} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span>{children}</span>
        <Center>
          <Icon size={14} stroke={1.5} style={{ opacity: sorted ? 1 : 0.5 }} />
        </Center>
      </UnstyledButton>
    </Table.Th>
  );
}

export default function JournalList({ onEdit }: JournalListProps) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [accountFilter, setAccountFilter] = useState<string | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState<string>('10');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // APIからデータを取得
  const { journalEntries, loading: entriesLoading, error: entriesError, deleteJournalEntry } = useJournalEntries();
  const { accounts, loading: accountsLoading, error: accountsError } = useAccounts();
  const [deleting, setDeleting] = useState<number | null>(null);

  const ITEMS_PER_PAGE = parseInt(itemsPerPage, 10);

  // ソート切り替え
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setPage(1); // ソート変更時はページを1に戻す
  };

  // アカウントの選択肢をAPIから取得
  const accountOptions = accounts ? [
    ...accounts.assets.map(account => ({ value: account.name, label: account.name })),
    ...accounts.liabilities.map(account => ({ value: account.name, label: account.name })),
    ...accounts.equity.map(account => ({ value: account.name, label: account.name })),
    ...accounts.revenue.map(account => ({ value: account.name, label: account.name })),
    ...accounts.expenses.map(account => ({ value: account.name, label: account.name })),
  ] : [];

  // ローディング状態の処理
  if (entriesLoading || accountsLoading) {
    return (
      <Stack align="center" justify="center" h="50vh">
        <Loader size="lg" />
        <Text>データを読み込み中...</Text>
      </Stack>
    );
  }

  // エラー状態の処理
  if (entriesError || accountsError) {
    return (
      <Alert icon={<IconAlertCircle size="1rem" />} title="エラー" color="red">
        {entriesError || accountsError}
      </Alert>
    );
  }

  // フィルタリング、ソート、ページネーションの適用
  const processedData = useMemo(() => {
    let data = [...(journalEntries || [])];

    // フィルタリング
    data = data.filter(item => {
      const itemDate = new Date(item.date);
      // 日付範囲フィルター
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (itemDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (itemDate > end) return false;
      }
      if (searchKeyword && !item.description.includes(searchKeyword)) return false;
      if (accountFilter && item.debit_account_name !== accountFilter && item.credit_account_name !== accountFilter) return false;
      return true;
    });

    // ソート
    if (sortField) {
      data.sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'date':
            comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
            break;
          case 'amount':
            comparison = a.amount - b.amount;
            break;
          case 'description':
            comparison = a.description.localeCompare(b.description, 'ja');
            break;
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return data;
  }, [journalEntries, startDate, endDate, searchKeyword, accountFilter, sortField, sortDirection]);

  const filteredData = processedData.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);

  const handleExport = () => {
    // CSVエクスポート
    const headers = ['日付', '借方勘定科目', '借方補助科目', '貸方勘定科目', '貸方補助科目', '金額', '摘要'];
    const csvData = (journalEntries || []).map(item => [
      item.date,
      item.debit_account_name,
      item.debit_subaccount_name || '',
      item.credit_account_name,
      item.credit_subaccount_name || '',
      item.amount,
      item.description
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `仕訳帳_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('この仕訳を削除しますか？')) return;

    setDeleting(id);
    try {
      await deleteJournalEntry(id);
    } catch (err) {
      alert('削除に失敗しました');
    } finally {
      setDeleting(null);
    }
  };

  const handleEdit = (item: {
    id: number;
    date: string;
    description: string;
    debit_account_name: string;
    credit_account_name: string;
    amount: number;
  }) => {
    onEdit(item);
    navigate('/journal-entry');
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>仕訳帳</Title>
        <Button 
          leftSection={<IconPlus size={16} />}
          onClick={() => navigate('/journal-entry')}
                  >
          新規仕訳
        </Button>
      </Group>

      {/* フィルター部分 */}
      <Paper p="md" radius="md" withBorder>
        <Grid align="flex-end">
          <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
            <DateInput
              label="開始日"
              placeholder="開始日"
              value={startDate}
              onChange={(date) => {
                setStartDate(date);
                setPage(1);
              }}
              clearable
              locale="ja"
              valueFormat="YYYY/MM/DD"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
            <DateInput
              label="終了日"
              placeholder="終了日"
              value={endDate}
              onChange={(date) => {
                setEndDate(date);
                setPage(1);
              }}
              clearable
              locale="ja"
              valueFormat="YYYY/MM/DD"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
            <Select
              label="勘定科目"
              placeholder="勘定科目で検索"
              data={accountOptions}
              value={accountFilter}
              onChange={(value) => {
                setAccountFilter(value);
                setPage(1);
              }}
              clearable
              searchable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <TextInput
              label="摘要検索"
              placeholder="摘要で検索..."
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setPage(1);
              }}
              leftSection={<IconSearch size={16} />}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 1.5 }}>
            <Select
              label="表示件数"
              data={[
                { value: '10', label: '10件' },
                { value: '50', label: '50件' },
                { value: '200', label: '200件' },
              ]}
              value={itemsPerPage}
              onChange={(value) => {
                setItemsPerPage(value || '10');
                setPage(1);
              }}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 1.5 }}>
            <Button
              variant="outline"
              leftSection={<IconFilter size={16} />}
              fullWidth
              onClick={() => {
                setStartDate(null);
                setEndDate(null);
                setAccountFilter(null);
                setSearchKeyword('');
                setPage(1);
              }}
            >
              クリア
            </Button>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* テーブル部分 */}
      <Paper radius="md" withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Th
                sorted={sortField === 'date'}
                reversed={sortDirection === 'asc'}
                onSort={() => handleSort('date')}
                width="100px"
              >
                日付
              </Th>
              <Table.Th style={{ width: '180px' }}>借方勘定科目</Table.Th>
              <Th
                sorted={sortField === 'amount'}
                reversed={sortDirection === 'asc'}
                onSort={() => handleSort('amount')}
                width="100px"
                textAlign="right"
              >
                金額
              </Th>
              <Table.Th style={{ width: '180px' }}>貸方勘定科目</Table.Th>
              <Table.Th style={{ textAlign: 'right', width: '100px' }}>金額</Table.Th>
              <Th
                sorted={sortField === 'description'}
                reversed={sortDirection === 'asc'}
                onSort={() => handleSort('description')}
              >
                摘要
              </Th>
              <Table.Th style={{ width: '100px' }}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredData.map((item) => (
              <Table.Tr key={item.id}>
                <Table.Td>{new Date(item.date).toLocaleDateString('ja-JP')}</Table.Td>
                <Table.Td style={{ fontWeight: 500 }}>
                  {item.debit_account_name}
                  {item.debit_subaccount_name ? (
                    <span style={{ color: 'var(--mantine-color-dimmed)', marginLeft: 6, fontSize: '0.9em' }}>（{item.debit_subaccount_name}）</span>
                  ) : null}
                </Table.Td>
                <Table.Td style={{ textAlign: 'right', fontWeight: 600, fontSize: '14px' }}>
                  {item.amount.toLocaleString()}
                </Table.Td>
                <Table.Td style={{ fontWeight: 500 }}>
                  {item.credit_account_name}
                  {item.credit_subaccount_name ? (
                    <span style={{ color: 'var(--mantine-color-dimmed)', marginLeft: 6, fontSize: '0.9em' }}>（{item.credit_subaccount_name}）</span>
                  ) : null}
                </Table.Td>
                <Table.Td style={{ textAlign: 'right', fontWeight: 600, fontSize: '14px' }}>
                  {item.amount.toLocaleString()}
                </Table.Td>
                <Table.Td>{item.description}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={() => handleEdit(item)}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                    <Menu shadow="md" width={200}>
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray">
                          <IconDotsVertical size={16} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<IconTrash size={16} />}
                          color="red"
                          onClick={() => handleDelete(item.id)}
                          disabled={deleting === item.id}
                        >
                          {deleting === item.id ? '削除中...' : '削除'}
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        {/* ページネーションと概要 */}
        <Group justify="space-between" p="md">
          <Text size="sm" c="dimmed">
            {processedData.length > 0 ? (
              <>全{processedData.length}件中 {(page - 1) * ITEMS_PER_PAGE + 1} - {Math.min(page * ITEMS_PER_PAGE, processedData.length)}件を表示</>
            ) : (
              '該当するデータがありません'
            )}
          </Text>
          <Group gap="xs">
                  <Button 
                    variant="light" 
                    leftSection={<IconDownload size={16} />}
                    onClick={handleExport}
                                      >
                    CSVエクスポート
                  </Button>
            <Pagination 
              value={page} 
              onChange={setPage} 
              total={totalPages}
              size="sm"
            />
          </Group>
        </Group>
      </Paper>
    </Stack>
  );
}
