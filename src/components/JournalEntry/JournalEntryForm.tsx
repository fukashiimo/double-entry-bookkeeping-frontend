import { useMemo, useState } from 'react';
import { Box, NumberInput, Textarea, Button, Select, Grid, Paper, Title, Alert, Loader, Stack, Text } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconAlertCircle } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useAccounts } from '../../hooks/useAccounts';
import { useSubaccounts } from '../../hooks/useSubaccounts';
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
  const { fetchSubaccounts } = useSubaccounts();
  const [debitSubOptions, setDebitSubOptions] = useState<{ value: string; label: string }[]>([]);
  const [creditSubOptions, setCreditSubOptions] = useState<{ value: string; label: string }[]>([]);

  const isEditMode = !!editData;

  const form = useForm({
    initialValues: {
      date: editData ? new Date(editData.date) : new Date(),
      description: editData?.description || '',
      debitAccount: editData?.debit_account_name || '',
      debitSubaccount: '',
      creditAccount: editData?.credit_account_name || '',
      creditSubaccount: '',
      amount: editData?.amount || 0,
    },
    validate: {
      description: (value: string) => (value.length < 1 ? '摘要を入力してください' : null),
      debitAccount: (value: string) => (value.length < 1 ? '借方勘定を選択してください' : null),
      creditAccount: (value: string) => (value.length < 1 ? '貸方勘定を選択してください' : null),
      amount: (value: number) => (value <= 0 ? '金額を入力してください' : null),
    },
  });

  // グループ化された勘定科目の選択肢を作成
  const groupedAccountOptions = accounts ? [
    {
      group: '資産',
      items: accounts.assets.map(account => ({
        value: account.name,
        label: `　${account.name}`,
      }))
    },
    {
      group: '負債',
      items: accounts.liabilities.map(account => ({
        value: account.name,
        label: `　${account.name}`,
      }))
    },
    {
      group: '純資産',
      items: accounts.equity.map(account => ({
        value: account.name,
        label: `　${account.name}`,
      }))
    },
    {
      group: '収益',
      items: accounts.revenue.map(account => ({
        value: account.name,
        label: `　${account.name}`,
      }))
    },
    {
      group: '費用',
      items: accounts.expenses.map(account => ({
        value: account.name,
        label: `　${account.name}`,
      }))
    },
  ] : [];

  // 便利関数: 勘定科目名からIDを取得
  const findAccountIdByName = useMemo(() => {
    if (!accounts) return (_name: string) => undefined as number | undefined;
    const nameToId = new Map<string, number>();
    [
      ...accounts.assets,
      ...accounts.liabilities,
      ...accounts.equity,
      ...accounts.revenue,
      ...accounts.expenses,
    ].forEach(a => nameToId.set(a.name, a.id));
    return (name: string) => nameToId.get(name);
  }, [accounts]);

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setError(null);
    
    try {
      // Supabase APIに送信
      const entryData = {
        date: values.date.toISOString().split('T')[0],
        description: values.description,
        debitAccount: values.debitAccount,
        debitSubaccount: values.debitSubaccount || null,
        creditAccount: values.creditAccount,
        creditSubaccount: values.creditSubaccount || null,
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
        <Paper p="md" radius="md" withBorder>
        <Loader size="lg" />
        <p>勘定科目を読み込み中...</p>
      </Paper>
    );
  }

  return (
        <Paper p="md" radius="md" withBorder>
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
            <Paper p="xl" withBorder radius="md" style={{ 
              backgroundColor: 'var(--debit-bg)', 
              borderColor: 'var(--debit-border)',
              borderWidth: '2px'
            }}>
              <Text size="sm" fw={600} c="teal" mb="lg" style={{ 
                color: 'var(--debit-text)',
                fontSize: '16px',
                letterSpacing: '0.5px'
              }}>借方</Text>
              <Stack gap="md">
                <Select
                  label="借方科目"
                  placeholder="科目を選択"
                  data={groupedAccountOptions}
                  searchable
                  required
                  {...form.getInputProps('debitAccount')}
                  onChange={async (val) => {
                    form.setFieldValue('debitAccount', val || '')
                    form.setFieldValue('debitSubaccount', '')
                    const accountId = val ? findAccountIdByName(val) : undefined
                    const list = await fetchSubaccounts(accountId)
                    setDebitSubOptions(list.map(s => ({ value: s.name, label: s.name })))
                  }}
                />
                <Select
                  label="補助科目"
                  placeholder="補助科目を選択"
                  data={debitSubOptions}
                  searchable
                  clearable
                  {...form.getInputProps('debitSubaccount')}
                />
              </Stack>
            </Paper>
          </Grid.Col>

          {/* 貸方 */}
          <Grid.Col span={6}>
            <Paper p="xl" withBorder radius="md" style={{ 
              backgroundColor: 'var(--credit-bg)', 
              borderColor: 'var(--credit-border)',
              borderWidth: '2px'
            }}>
              <Text size="sm" fw={600} c="pink" mb="lg" style={{ 
                color: 'var(--credit-text)',
                fontSize: '16px',
                letterSpacing: '0.5px'
              }}>貸方</Text>
              <Stack gap="md">
                <Select
                  label="貸方科目"
                  placeholder="科目を選択"
                  data={groupedAccountOptions}
                  searchable
                  required
                  {...form.getInputProps('creditAccount')}
                  onChange={async (val) => {
                    form.setFieldValue('creditAccount', val || '')
                    form.setFieldValue('creditSubaccount', '')
                    const accountId = val ? findAccountIdByName(val) : undefined
                    const list = await fetchSubaccounts(accountId)
                    setCreditSubOptions(list.map(s => ({ value: s.name, label: s.name })))
                  }}
                />
                <Select
                  label="補助科目"
                  placeholder="補助科目を選択"
                  data={creditSubOptions}
                  searchable
                  clearable
                  {...form.getInputProps('creditSubaccount')}
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
