import { useState } from 'react';
import { Box, NumberInput, Textarea, Button, Select, Grid, Paper, Title, Alert, Loader, Stack, Text } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconAlertCircle } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useAccounts } from '../../hooks/useAccounts';
import { useJournalEntries } from '../../hooks/useJournalEntries';
import 'dayjs/locale/ja';

interface JournalEntryFormProps {
  onSubmit?: (data: { date: Date | null; [key: string]: unknown }) => void;
  editData?: {
    id: number;
    date: string;
    description: string;
    debit_account_name: string;
    credit_account_name: string;
    amount: number;
  };
  onCancel?: () => void;
}

export const JournalEntryForm = ({ onSubmit, editData, onCancel }: JournalEntryFormProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { accounts, loading: accountsLoading } = useAccounts();
  const { createJournalEntry } = useJournalEntries();

  const isEditMode = !!editData;

  const form = useForm({
    initialValues: {
      date: editData ? new Date(editData.date) : new Date(),
      description: editData?.description || '',
      debitAccount: editData?.debit_account_name || '',
      creditAccount: editData?.credit_account_name || '',
      amount: editData?.amount || 0,
    },
    validate: {
      description: (value: string) => (value.length < 1 ? '摘要を入力してください' : null),
      debitAccount: (value: string) => (value.length < 1 ? '借方勘定を選択してください' : null),
      creditAccount: (value: string) => (value.length < 1 ? '貸方勘定を選択してください' : null),
      amount: (value: number) => (value <= 0 ? '金額を入力してください' : null),
    },
  });

  // 全勘定科目を一つの配列にまとめる
  const allAccounts = accounts ? [
    ...accounts.assets,
    ...accounts.liabilities,
    ...accounts.equity,
    ...accounts.revenue,
    ...accounts.expenses,
  ] : [];

  const accountOptions = allAccounts.map(account => ({
    value: account.name,
    label: `${account.name} (${account.type})`,
  }));

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setError(null);
    
    try {
      // Supabase APIに送信
      const entryData = {
        date: values.date.toISOString().split('T')[0],
        description: values.description,
        debitAccount: values.debitAccount,
        creditAccount: values.creditAccount,
        amount: values.amount,
      };

      await createJournalEntry(entryData);
      
      // フォームをリセット
      form.reset();
      
      // 親コンポーネントのonSubmitがあれば実行
      if (onSubmit) {
        onSubmit(values);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      console.error('Error submitting form:', err);
    } finally {
      setLoading(false);
    }
  };

  if (accountsLoading) {
    return (
      <Paper p="md" radius="md">
        <Loader size="lg" />
        <p>勘定科目を読み込み中...</p>
      </Paper>
    );
  }

  return (
    <Paper p="md" radius="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Title order={2} mb="md">{isEditMode ? '仕訳編集' : '仕訳入力'}</Title>
        
        {error && (
          <Alert icon={<IconAlertCircle size="1rem" />} title="エラー" color="red" mb="md">
            {error}
          </Alert>
        )}
        
        {/* 日付 */}
        <Grid mb="md">
          <Grid.Col span={4}>
            <DateInput
              label="日付"
              placeholder="日付を選択"
              value={form.values.date}
              onChange={(date) => form.setFieldValue('date', date || new Date())}
              locale="ja"
              required
            />
          </Grid.Col>
        </Grid>

        {/* 仕訳入力 - 左右レイアウト */}
        <Grid mb="md">
          {/* 借方 */}
          <Grid.Col span={6}>
            <Paper p="md" withBorder radius="md" style={{ backgroundColor: '#F0FDF4', borderColor: '#16A34A' }}>
              <Text size="sm" fw={600} c="green" mb="md">借方</Text>
              <Stack gap="md">
                <Select
                  label="借方科目"
                  placeholder="科目を選択"
                  data={accountOptions}
                  searchable
                  required
                  {...form.getInputProps('debitAccount')}
                />
                <Select
                  label="補助科目"
                  placeholder="補助科目を選択"
                  data={[]}
                  searchable
                  clearable
                />
              </Stack>
            </Paper>
          </Grid.Col>

          {/* 貸方 */}
          <Grid.Col span={6}>
            <Paper p="md" withBorder radius="md" style={{ backgroundColor: '#FEF2F2', borderColor: '#DC2626' }}>
              <Text size="sm" fw={600} c="red" mb="md">貸方</Text>
              <Stack gap="md">
                <Select
                  label="貸方科目"
                  placeholder="科目を選択"
                  data={accountOptions}
                  searchable
                  required
                  {...form.getInputProps('creditAccount')}
                />
                <Select
                  label="補助科目"
                  placeholder="補助科目を選択"
                  data={[]}
                  searchable
                  clearable
                />
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* 金額入力 */}
        <Grid mb="md" align="flex-end">
          <Grid.Col span={4}>
            <NumberInput
              label="金額"
              placeholder="金額を入力"
              required
              min={0}
              thousandSeparator=","
              {...form.getInputProps('amount')}
            />
          </Grid.Col>
          <Grid.Col span={8}>
            <Text size="sm" c="dimmed">
              借方・貸方の金額は同じになります
            </Text>
          </Grid.Col>
        </Grid>

        {/* 摘要 */}
        <Textarea
          label="摘要"
          placeholder="取引の内容を入力"
          minRows={2}
          mb="md"
          {...form.getInputProps('description')}
        />

        {/* メモ */}
        <Textarea
          label="メモ"
          placeholder="備考やメモを入力"
          minRows={2}
          mb="md"
        />

        {/* 送信ボタン */}
        <Box style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          {isEditMode && onCancel && (
            <Button variant="outline" size="md" onClick={onCancel}>
              キャンセル
            </Button>
          )}
          <Button type="submit" size="md" loading={loading}>
            {isEditMode ? '更新' : '登録'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};