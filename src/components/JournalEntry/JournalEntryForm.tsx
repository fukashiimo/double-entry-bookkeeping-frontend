import { useMemo, useState } from 'react';
import { Box, NumberInput, Textarea, Button, Select, Grid, Paper, Title, Alert, Loader, Stack, Text, SegmentedControl, Stepper, Group, useMantineTheme, useMantineColorScheme } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconAlertCircle, IconArrowRight, IconArrowLeft } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useAccounts } from '../../hooks/useAccounts';
import { useSubaccounts } from '../../hooks/useSubaccounts';
import { useJournalEntries } from '../../hooks/useJournalEntries';
import 'dayjs/locale/ja';

type InputMode = 'transfer' | 'journal' | 'simple';

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
  const { createJournalEntry, updateJournalEntry } = useJournalEntries();
  const { fetchSubaccounts } = useSubaccounts();
  const [debitSubOptions, setDebitSubOptions] = useState<{ value: string; label: string }[]>([]);
  const [creditSubOptions, setCreditSubOptions] = useState<{ value: string; label: string }[]>([]);
  const [inputMode, setInputMode] = useState<InputMode>('transfer');
  const [simpleStep, setSimpleStep] = useState(0);
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  const isEditMode = !!editData;

  const form = useForm({
    initialValues: {
      date: editData ? new Date(editData.date) : new Date(),
      description: editData?.description || '',
      debitAccount: editData?.debit_account_name || '',
      debitSubaccount: '',
      creditAccount: editData?.credit_account_name || '',
      creditSubaccount: '',
      debitAmount: editData?.amount || 0,
      creditAmount: editData?.amount || 0,
    },
    validate: {
      description: (value: string) => (value.length < 1 ? '摘要を入力してください' : null),
      debitAccount: (value: string) => (value.length < 1 ? '借方勘定を選択してください' : null),
      creditAccount: (value: string) => (value.length < 1 ? '貸方勘定を選択してください' : null),
      debitAmount: (value: number) => (value <= 0 ? '借方金額を入力してください' : null),
      creditAmount: (value: number, values) => {
        if (value <= 0) return '貸方金額を入力してください';
        if (value !== values.debitAmount) return '借方金額と貸方金額が一致しません';
        return null;
      },
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
        amount: values.debitAmount, // 借方金額と貸方金額は同じ（バリデーション済み）
      };

      if (isEditMode && editData) {
        // 編集モード: 更新APIを呼び出す
        await updateJournalEntry({
          id: editData.id,
          ...entryData,
        });
      } else {
        // 新規作成モード
        await createJournalEntry(entryData);
      }

      // フォームをリセット
      form.reset();
      setSimpleStep(0);

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

  // 日付フォーマット（YYYY/MM/DD）
  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}/${m}/${d}`;
  };

  // 借方金額変更時に貸方も同期
  const handleDebitAmountChange = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    form.setFieldValue('debitAmount', numValue);
    form.setFieldValue('creditAmount', numValue);
  };

  // 貸方金額変更時に借方も同期
  const handleCreditAmountChange = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    form.setFieldValue('creditAmount', numValue);
    form.setFieldValue('debitAmount', numValue);
  };

  // 簡単入力モードの次へ
  const handleSimpleNext = () => {
    if (simpleStep < 3) {
      setSimpleStep(simpleStep + 1);
    }
  };

  // 簡単入力モードの戻る
  const handleSimpleBack = () => {
    if (simpleStep > 0) {
      setSimpleStep(simpleStep - 1);
    }
  };

  // 振替伝票入力モード
  const renderTransferMode = () => (
    <>
      {/* 日付 */}
      <Grid mb="md">
        <Grid.Col span={4}>
          <DateInput
            label="日付"
            placeholder="日付を選択"
            value={form.values.date}
            onChange={(date) => form.setFieldValue('date', date || new Date())}
            locale="ja"
            valueFormat="YYYY/MM/DD"
            required
          />
        </Grid.Col>
      </Grid>

      {/* 仕訳入力 - 左右レイアウト */}
      <Grid mb="md">
        {/* 借方 */}
        <Grid.Col span={6}>
          <Paper p="xl" withBorder radius="md">
            <Text size="sm" fw={600} c="teal" mb="lg" style={{
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
                placeholder={debitSubOptions.length === 0 ? '補助科目なし' : '補助科目を選択'}
                data={debitSubOptions}
                searchable
                clearable
                disabled={debitSubOptions.length === 0}
                {...form.getInputProps('debitSubaccount')}
              />
              <NumberInput
                label="借方金額"
                placeholder="金額を入力"
                required
                min={0}
                thousandSeparator=","
                value={form.values.debitAmount}
                onChange={handleDebitAmountChange}
                error={form.errors.debitAmount}
              />
            </Stack>
          </Paper>
        </Grid.Col>

        {/* 貸方 */}
        <Grid.Col span={6}>
          <Paper p="xl" withBorder radius="md">
            <Text size="sm" fw={600} c="pink" mb="lg" style={{
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
                placeholder={creditSubOptions.length === 0 ? '補助科目なし' : '補助科目を選択'}
                data={creditSubOptions}
                searchable
                clearable
                disabled={creditSubOptions.length === 0}
                {...form.getInputProps('creditSubaccount')}
              />
              <NumberInput
                label="貸方金額"
                placeholder="金額を入力"
                required
                min={0}
                thousandSeparator=","
                value={form.values.creditAmount}
                onChange={handleCreditAmountChange}
                error={form.errors.creditAmount}
              />
            </Stack>
          </Paper>
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
    </>
  );

  // 仕訳帳入力モード（テーブル形式）
  const renderJournalMode = () => (
    <>
      {/* 日付 */}
      <Grid mb="md">
        <Grid.Col span={4}>
          <DateInput
            label="日付"
            placeholder="日付を選択"
            value={form.values.date}
            onChange={(date) => form.setFieldValue('date', date || new Date())}
            locale="ja"
            valueFormat="YYYY/MM/DD"
            required
          />
        </Grid.Col>
      </Grid>

      {/* テーブル形式の入力 */}
      <Paper withBorder radius="md" mb="md" style={{ overflow: 'hidden' }}>
        <Box style={{
          display: 'grid',
          gridTemplateColumns: '1fr 120px 1fr 120px',
          gap: '1px',
          backgroundColor: colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3],
        }}>
          {/* ヘッダー */}
          <Box p="xs" style={{ backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[1] }}>
            <Text size="sm" fw={600} ta="center">借方科目</Text>
          </Box>
          <Box p="xs" style={{ backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[1] }}>
            <Text size="sm" fw={600} ta="center">借方金額</Text>
          </Box>
          <Box p="xs" style={{ backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[1] }}>
            <Text size="sm" fw={600} ta="center">貸方科目</Text>
          </Box>
          <Box p="xs" style={{ backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[1] }}>
            <Text size="sm" fw={600} ta="center">貸方金額</Text>
          </Box>

          {/* 入力行 */}
          <Box p="xs" style={{ backgroundColor: colorScheme === 'dark' ? theme.colors.dark[7] : 'white' }}>
            <Select
              placeholder="科目を選択"
              data={groupedAccountOptions}
              searchable
              size="sm"
              {...form.getInputProps('debitAccount')}
              onChange={async (val) => {
                form.setFieldValue('debitAccount', val || '')
                form.setFieldValue('debitSubaccount', '')
                const accountId = val ? findAccountIdByName(val) : undefined
                const list = await fetchSubaccounts(accountId)
                setDebitSubOptions(list.map(s => ({ value: s.name, label: s.name })))
              }}
            />
          </Box>
          <Box p="xs" style={{ backgroundColor: colorScheme === 'dark' ? theme.colors.dark[7] : 'white' }}>
            <NumberInput
              placeholder="金額"
              min={0}
              size="sm"
              thousandSeparator=","
              value={form.values.debitAmount}
              onChange={handleDebitAmountChange}
              error={form.errors.debitAmount}
            />
          </Box>
          <Box p="xs" style={{ backgroundColor: colorScheme === 'dark' ? theme.colors.dark[7] : 'white' }}>
            <Select
              placeholder="科目を選択"
              data={groupedAccountOptions}
              searchable
              size="sm"
              {...form.getInputProps('creditAccount')}
              onChange={async (val) => {
                form.setFieldValue('creditAccount', val || '')
                form.setFieldValue('creditSubaccount', '')
                const accountId = val ? findAccountIdByName(val) : undefined
                const list = await fetchSubaccounts(accountId)
                setCreditSubOptions(list.map(s => ({ value: s.name, label: s.name })))
              }}
            />
          </Box>
          <Box p="xs" style={{ backgroundColor: colorScheme === 'dark' ? theme.colors.dark[7] : 'white' }}>
            <NumberInput
              placeholder="金額"
              min={0}
              size="sm"
              thousandSeparator=","
              value={form.values.creditAmount}
              onChange={handleCreditAmountChange}
              error={form.errors.creditAmount}
            />
          </Box>
        </Box>
      </Paper>

      {/* 補助科目（オプション） */}
      <Grid mb="md">
        <Grid.Col span={6}>
          <Select
            label="借方補助科目"
            placeholder={debitSubOptions.length === 0 ? '補助科目なし' : '補助科目を選択'}
            data={debitSubOptions}
            searchable
            clearable
            disabled={debitSubOptions.length === 0}
            {...form.getInputProps('debitSubaccount')}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <Select
            label="貸方補助科目"
            placeholder={creditSubOptions.length === 0 ? '補助科目なし' : '補助科目を選択'}
            data={creditSubOptions}
            searchable
            clearable
            disabled={creditSubOptions.length === 0}
            {...form.getInputProps('creditSubaccount')}
          />
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
    </>
  );

  // 簡単入力モード（ステップウィザード）
  const renderSimpleMode = () => (
    <>
      <Stepper active={simpleStep} mb="xl">
        <Stepper.Step label="日付・摘要" description="いつ・何を" />
        <Stepper.Step label="借方" description="何が増えた？" />
        <Stepper.Step label="貸方" description="何が減った？" />
        <Stepper.Step label="確認" description="内容を確認" />
      </Stepper>

      {simpleStep === 0 && (
        <Stack gap="md">
          <DateInput
            label="日付"
            placeholder="日付を選択"
            value={form.values.date}
            onChange={(date) => form.setFieldValue('date', date || new Date())}
            locale="ja"
            valueFormat="YYYY/MM/DD"
            required
            size="lg"
          />
          <Textarea
            label="何をしましたか？（摘要）"
            placeholder="例：コンビニで文房具を購入"
            minRows={3}
            size="lg"
            {...form.getInputProps('description')}
          />
        </Stack>
      )}

      {simpleStep === 1 && (
        <Stack gap="md">
          <Text size="lg" fw={500} mb="sm">借方（増えたもの・費用）</Text>
          <Select
            label="どの科目が増えましたか？"
            placeholder="科目を選択"
            data={groupedAccountOptions}
            searchable
            required
            size="lg"
            {...form.getInputProps('debitAccount')}
            onChange={async (val) => {
              form.setFieldValue('debitAccount', val || '')
              form.setFieldValue('debitSubaccount', '')
              const accountId = val ? findAccountIdByName(val) : undefined
              const list = await fetchSubaccounts(accountId)
              setDebitSubOptions(list.map(s => ({ value: s.name, label: s.name })))
            }}
          />
          {debitSubOptions.length > 0 && (
            <Select
              label="補助科目（任意）"
              placeholder="補助科目を選択"
              data={debitSubOptions}
              searchable
              clearable
              size="lg"
              {...form.getInputProps('debitSubaccount')}
            />
          )}
          <NumberInput
            label="いくらですか？"
            placeholder="金額を入力"
            required
            min={0}
            size="lg"
            thousandSeparator=","
            value={form.values.debitAmount}
            onChange={handleDebitAmountChange}
            error={form.errors.debitAmount}
          />
        </Stack>
      )}

      {simpleStep === 2 && (
        <Stack gap="md">
          <Text size="lg" fw={500} mb="sm">貸方（減ったもの・収益）</Text>
          <Select
            label="どの科目が減りましたか？"
            placeholder="科目を選択"
            data={groupedAccountOptions}
            searchable
            required
            size="lg"
            {...form.getInputProps('creditAccount')}
            onChange={async (val) => {
              form.setFieldValue('creditAccount', val || '')
              form.setFieldValue('creditSubaccount', '')
              const accountId = val ? findAccountIdByName(val) : undefined
              const list = await fetchSubaccounts(accountId)
              setCreditSubOptions(list.map(s => ({ value: s.name, label: s.name })))
            }}
          />
          {creditSubOptions.length > 0 && (
            <Select
              label="補助科目（任意）"
              placeholder="補助科目を選択"
              data={creditSubOptions}
              searchable
              clearable
              size="lg"
              {...form.getInputProps('creditSubaccount')}
            />
          )}
          <NumberInput
            label="いくらですか？"
            placeholder="金額を入力"
            required
            min={0}
            size="lg"
            thousandSeparator=","
            value={form.values.creditAmount}
            onChange={handleCreditAmountChange}
            error={form.errors.creditAmount}
          />
        </Stack>
      )}

      {simpleStep === 3 && (
        <Stack gap="md">
          <Text size="lg" fw={500} mb="sm">入力内容の確認</Text>
          <Paper p="md" withBorder radius="md" style={{
            backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0]
          }}>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text c="dimmed">日付</Text>
                <Text fw={500}>{formatDate(form.values.date)}</Text>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed">摘要</Text>
                <Text fw={500}>{form.values.description || '(未入力)'}</Text>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed">借方科目</Text>
                <Text fw={500}>{form.values.debitAccount || '(未選択)'}</Text>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed">借方金額</Text>
                <Text fw={500}>{form.values.debitAmount.toLocaleString()}</Text>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed">貸方科目</Text>
                <Text fw={500}>{form.values.creditAccount || '(未選択)'}</Text>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed">貸方金額</Text>
                <Text fw={500}>{form.values.creditAmount.toLocaleString()}</Text>
              </Group>
            </Stack>
          </Paper>
        </Stack>
      )}

      {/* ステップナビゲーション */}
      <Group justify="space-between" mt="xl">
        <Button
          variant="outline"
          leftSection={<IconArrowLeft size={16} />}
          onClick={handleSimpleBack}
          disabled={simpleStep === 0}
        >
          戻る
        </Button>
        {simpleStep < 3 ? (
          <Button
            rightSection={<IconArrowRight size={16} />}
            onClick={handleSimpleNext}
          >
            次へ
          </Button>
        ) : (
          <Button type="submit" loading={loading}>
            登録
          </Button>
        )}
      </Group>
    </>
  );

  return (
    <Paper p="md" radius="md" withBorder>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Group justify="space-between" mb="md">
          <Title order={2}>{isEditMode ? '仕訳編集' : '仕訳入力'}</Title>
          {!isEditMode && (
            <SegmentedControl
              value={inputMode}
              onChange={(value) => setInputMode(value as InputMode)}
              data={[
                { label: '振替伝票', value: 'transfer' },
                { label: '仕訳帳', value: 'journal' },
                { label: '簡単入力', value: 'simple' },
              ]}
            />
          )}
        </Group>

        {error && (
          <Alert icon={<IconAlertCircle size="1rem" />} title="エラー" color="red" mb="md">
            {error}
          </Alert>
        )}

        {inputMode === 'transfer' && renderTransferMode()}
        {inputMode === 'journal' && renderJournalMode()}
        {inputMode === 'simple' && renderSimpleMode()}

        {/* 送信ボタン（簡単入力モード以外） */}
        {inputMode !== 'simple' && (
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
        )}
      </form>
    </Paper>
  );
};
