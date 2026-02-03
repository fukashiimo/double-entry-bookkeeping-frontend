import { useState } from 'react';
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
  Alert
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
  IconAlertCircle
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

export default function JournalList({ onEdit }: JournalListProps) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchDate, setSearchDate] = useState<Date | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [accountFilter, setAccountFilter] = useState<string | null>(null);

  // APIからデータを取得
  const { journalEntries, loading: entriesLoading, error: entriesError, deleteJournalEntry } = useJournalEntries();
  const { accounts, loading: accountsLoading, error: accountsError } = useAccounts();
  const [deleting, setDeleting] = useState<number | null>(null);

  const ITEMS_PER_PAGE = 10;

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

  // フィルタリングとページネーションの適用
  const filteredData = (journalEntries || [])
    .filter(item => {
      if (searchDate && new Date(item.date).toDateString() !== searchDate.toDateString()) return false;
      if (searchKeyword && !item.description.includes(searchKeyword)) return false;
      if (accountFilter && item.debit_account_name !== accountFilter && item.credit_account_name !== accountFilter) return false;
      return true;
    })
    .slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const totalPages = Math.ceil((journalEntries || []).length / ITEMS_PER_PAGE);

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
          color="orange"
        >
          新規仕訳
        </Button>
      </Group>

      {/* フィルター部分 */}
            <Paper p="md" radius="md" withBorder>
        <Grid align="flex-end">
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <DateInput
              label="日付"
              placeholder="日付で検索"
              value={searchDate}
              onChange={setSearchDate}
              clearable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Select
              label="勘定科目"
              placeholder="勘定科目で検索"
              data={accountOptions}
              value={accountFilter}
              onChange={setAccountFilter}
              clearable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <TextInput
              label="検索"
              placeholder="内容で検索..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              leftSection={<IconSearch size={16} />}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
                  <Button 
                    variant="outline" 
                    leftSection={<IconFilter size={16} />}
                    fullWidth
                    color="orange"
                  >
                    絞り込み
                  </Button>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* テーブル部分 */}
            <Paper radius="md" withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: '100px' }}>日付</Table.Th>
              <Table.Th style={{ width: '280px' }}>借方勘定科目</Table.Th>
              <Table.Th style={{ width: '280px' }}>貸方勘定科目</Table.Th>
              <Table.Th style={{ textAlign: 'right', width: '120px' }}>金額</Table.Th>
              <Table.Th>内容</Table.Th>
              <Table.Th style={{ width: '80px' }}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredData.map((item) => (
              <Table.Tr key={item.id}>
                <Table.Td>{new Date(item.date).toLocaleDateString('ja-JP')}</Table.Td>
                <Table.Td style={{ 
                  fontWeight: 500, 
                  color: 'var(--debit-text)', 
                  backgroundColor: 'var(--debit-bg)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  border: '1px solid var(--debit-border)'
                }}>
                  {item.debit_account_name}
                  {item.debit_subaccount_name ? (
                    <span style={{ color: 'var(--debit-subtext)', marginLeft: 6, fontSize: '0.9em' }}>（{item.debit_subaccount_name}）</span>
                  ) : null}
                </Table.Td>
                <Table.Td style={{ 
                  fontWeight: 500, 
                  color: 'var(--credit-text)', 
                  backgroundColor: 'var(--credit-bg)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  border: '1px solid var(--credit-border)'
                }}>
                  {item.credit_account_name}
                  {item.credit_subaccount_name ? (
                    <span style={{ color: 'var(--credit-subtext)', marginLeft: 6, fontSize: '0.9em' }}>（{item.credit_subaccount_name}）</span>
                  ) : null}
                </Table.Td>
                <Table.Td style={{ textAlign: 'right', fontWeight: 600, fontSize: '14px' }}>
                  ¥{item.amount.toLocaleString()}
                </Table.Td>
                <Table.Td>{item.description}</Table.Td>
                <Table.Td>
                  <Menu shadow="md" width={200}>
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray">
                        <IconDotsVertical size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item 
                        leftSection={<IconEdit size={16} />}
                        onClick={() => handleEdit(item)}
                      >
                        編集
                      </Menu.Item>
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
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        {/* ページネーションと概要 */}
        <Group justify="space-between" p="md">
          <Text size="sm" c="dimmed">
            全{(journalEntries || []).length}件中 {(page - 1) * ITEMS_PER_PAGE + 1} - {Math.min(page * ITEMS_PER_PAGE, (journalEntries || []).length)}件を表示
          </Text>
          <Group gap="xs">
                  <Button 
                    variant="light" 
                    leftSection={<IconDownload size={16} />}
                    onClick={handleExport}
                    color="orange"
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
