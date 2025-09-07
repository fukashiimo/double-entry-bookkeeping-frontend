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
  Grid
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { 
  IconSearch, 
  IconDotsVertical, 
  IconEdit, 
  IconTrash, 
  IconDownload,
  IconPlus,
  IconFilter
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

// サンプルデータ
const sampleData = Array.from({ length: 50 }, (_, index) => ({
  id: index + 1,
  date: new Date(2024, 2, Math.floor(Math.random() * 31) + 1),
  debitAccount: '現金',
  debitAmount: Math.floor(Math.random() * 1000000),
  creditAccount: '売上',
  creditAmount: Math.floor(Math.random() * 1000000),
  description: `取引内容 ${index + 1}`,
}));

export default function JournalList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchDate, setSearchDate] = useState<Date | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [accountFilter, setAccountFilter] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(sampleData.length / ITEMS_PER_PAGE);

  // アカウントの選択肢
  const accountOptions = [
    { value: '現金', label: '現金' },
    { value: '普通預金', label: '普通預金' },
    { value: '売上', label: '売上' },
    { value: '仕入', label: '仕入' },
  ];

  // フィルタリングとページネーションの適用
  const filteredData = sampleData
    .filter(item => {
      if (searchDate && item.date.toDateString() !== searchDate.toDateString()) return false;
      if (searchKeyword && !item.description.includes(searchKeyword)) return false;
      if (accountFilter && item.debitAccount !== accountFilter && item.creditAccount !== accountFilter) return false;
      return true;
    })
    .slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleExport = () => {
    // CSVエクスポート機能を実装予定
    console.log('Export to CSV');
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
      <Paper shadow="xs" p="md" radius="md">
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
            >
              絞り込み
            </Button>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* テーブル部分 */}
      <Paper shadow="xs" radius="md">
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>日付</Table.Th>
              <Table.Th>借方勘定科目</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>金額</Table.Th>
              <Table.Th>貸方勘定科目</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>金額</Table.Th>
              <Table.Th>内容</Table.Th>
              <Table.Th style={{ width: 80 }}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredData.map((item) => (
              <Table.Tr key={item.id}>
                <Table.Td>{item.date.toLocaleDateString('ja-JP')}</Table.Td>
                <Table.Td>{item.debitAccount}</Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  ¥{item.debitAmount.toLocaleString()}
                </Table.Td>
                <Table.Td>{item.creditAccount}</Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  ¥{item.creditAmount.toLocaleString()}
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
                      <Menu.Item leftSection={<IconEdit size={16} />}>
                        編集
                      </Menu.Item>
                      <Menu.Item leftSection={<IconTrash size={16} />} color="red">
                        削除
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
            全{sampleData.length}件中 {(page - 1) * ITEMS_PER_PAGE + 1} - {Math.min(page * ITEMS_PER_PAGE, sampleData.length)}件を表示
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

