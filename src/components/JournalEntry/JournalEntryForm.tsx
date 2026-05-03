import { useMemo, useState, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { Box, NumberInput, TextInput, Button, Select, Grid, Paper, Title, Alert, Loader, Stack, Text, SegmentedControl, Group, useMantineTheme, useMantineColorScheme, Table } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconAlertCircle } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useAccounts } from '../../hooks/useAccounts';
import { useSubaccounts } from '../../hooks/useSubaccounts';
import { useJournalEntries } from '../../hooks/useJournalEntries';
import 'dayjs/locale/ja';

type InputMode = 'transfer' | 'journal' | 'simple';
type SimpleType = 'income' | 'expense' | 'transfer' | null;

interface JournalEntryFormProps {
  onSubmit?: (data: { date: Date | null; [key: string]: unknown }, isEditMode?: boolean) => void;
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
  const { journalEntries, createJournalEntry, updateJournalEntry, refetch: refetchJournalEntries } = useJournalEntries();
  const { fetchSubaccounts } = useSubaccounts();
  const [debitSubOptions, setDebitSubOptions] = useState<{ value: string; label: string }[]>([]);
  const [creditSubOptions, setCreditSubOptions] = useState<{ value: string; label: string }[]>([]);
  const [inputMode, setInputMode] = useState<InputMode>('transfer');
  const [simpleType, setSimpleType] = useState<SimpleType>(null);
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const formRef = useRef<HTMLFormElement>(null);

  // 入力フィールドのref（エンターキーで次の入力枠に移動するため）
  const debitAmountRef = useRef<HTMLInputElement>(null);
  const creditAmountRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);

  // 摘要欄でEnterキーを押すとフォームを送信
  const handleDescriptionKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  // Enterキーで次のフィールドに移動（IME問題を避けるため遅延）
  const handleEnterToNext = (nextRef: React.RefObject<HTMLInputElement | null>) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      // IME状態を維持するため遅延処理
      setTimeout(() => {
        nextRef.current?.focus();
      }, 10);
    }
  };

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
      debitAmount: (value: number) => (value === 0 ? '借方金額を入力してください' : null),
      creditAmount: (value: number, values) => {
        if (value === 0) return '貸方金額を入力してください';
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

  // 簡単入力用: 資産科目のみ（取引手段）
  const assetAccountOptions = accounts ? [
    {
      group: '資産',
      items: accounts.assets.map(account => ({
        value: account.name,
        label: `　${account.name}`,
      }))
    },
  ] : [];

  // 簡単入力用: 収益科目のみ
  const revenueAccountOptions = accounts ? [
    {
      group: '収益',
      items: accounts.revenue.map(account => ({
        value: account.name,
        label: `　${account.name}`,
      }))
    },
  ] : [];

  // 簡単入力用: 費用科目のみ
  const expenseAccountOptions = accounts ? [
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

  // 最近の仕訳（最新5件）
  const recentEntries = useMemo(() => {
    if (!journalEntries || journalEntries.length === 0) return [];
    return [...journalEntries]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [journalEntries]);

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setError(null);

    try {
      // Supabase APIに送信（タイムゾーンオフセットを考慮してローカル日付を使用）
      const localDate = values.date;
      const year = localDate.getFullYear();
      const month = String(localDate.getMonth() + 1).padStart(2, '0');
      const day = String(localDate.getDate()).padStart(2, '0');
      const entryData = {
        date: `${year}-${month}-${day}`,
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

      // 親コンポーネントのonSubmitがあれば実行
      if (onSubmit) {
        onSubmit(values, isEditMode);
      }

      // フォームをリセット（日付は保持して連続入力しやすくする）
      const currentDate = form.values.date;
      form.reset();
      form.setFieldValue('date', currentDate);
      setSimpleType(null);

      // 仕訳一覧を更新
      refetchJournalEntries();
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
                ref={debitAmountRef}
                label="借方金額"
                placeholder="金額を入力"
                required
                allowNegative
                hideControls
                thousandSeparator=","
                value={form.values.debitAmount}
                onChange={handleDebitAmountChange}
                error={form.errors.debitAmount}
                onKeyDown={handleEnterToNext(creditAmountRef)}
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
                ref={creditAmountRef}
                label="貸方金額"
                placeholder="金額を入力"
                required
                allowNegative
                hideControls
                thousandSeparator=","
                value={form.values.creditAmount}
                onChange={handleCreditAmountChange}
                error={form.errors.creditAmount}
                onKeyDown={handleEnterToNext(descriptionRef)}
              />
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* 摘要 */}
      <TextInput
        ref={descriptionRef}
        label="摘要"
        placeholder="取引の内容を入力（Enterで登録）"
        mb="md"
        onKeyDown={handleDescriptionKeyDown}
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
              allowNegative
              hideControls
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
              allowNegative
              hideControls
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
      <TextInput
        ref={descriptionRef}
        label="摘要"
        placeholder="取引の内容を入力（Enterで登録）"
        mb="md"
        onKeyDown={handleDescriptionKeyDown}
        {...form.getInputProps('description')}
      />
    </>
  );

  // 簡単入力モード（3パターン選択式・1画面）
  const renderSimpleMode = () => (
    <Stack gap="md">
      {/* 取引タイプ選択 */}
      <SegmentedControl
        value={simpleType || ''}
        onChange={(value) => {
          setSimpleType(value as SimpleType);
          // タイプ変更時に科目をリセット
          form.setFieldValue('debitAccount', '');
          form.setFieldValue('creditAccount', '');
          form.setFieldValue('debitSubaccount', '');
          form.setFieldValue('creditSubaccount', '');
          setDebitSubOptions([]);
          setCreditSubOptions([]);
        }}
        data={[
          { label: '収入', value: 'income' },
          { label: '支出', value: 'expense' },
          { label: '振替', value: 'transfer' },
        ]}
        fullWidth
        size="md"
      />

      {simpleType && (
        <>
          {/* 日付 */}
          <DateInput
            label="日付"
            placeholder="日付を選択"
            value={form.values.date}
            onChange={(date) => form.setFieldValue('date', date || new Date())}
            locale="ja"
            valueFormat="YYYY/MM/DD"
            required
            size="sm"
          />

          <Grid>
            {/* 科目選択 */}
            <Grid.Col span={6}>
              <Select
                label={
                  simpleType === 'income' ? '収入の種類' :
                  simpleType === 'expense' ? '支出の種類' :
                  '振替元（減少）'
                }
                placeholder="科目を選択"
                data={
                  simpleType === 'income' ? revenueAccountOptions :
                  simpleType === 'expense' ? expenseAccountOptions :
                  groupedAccountOptions
                }
                searchable
                required
                size="sm"
                value={simpleType === 'income' ? form.values.creditAccount :
                       simpleType === 'expense' ? form.values.debitAccount :
                       form.values.creditAccount}
                onChange={async (val) => {
                  if (simpleType === 'income') {
                    // 収入: 貸方に収益科目
                    form.setFieldValue('creditAccount', val || '');
                    form.setFieldValue('creditSubaccount', '');
                    const accountId = val ? findAccountIdByName(val) : undefined;
                    const list = await fetchSubaccounts(accountId);
                    setCreditSubOptions(list.map(s => ({ value: s.name, label: s.name })));
                  } else if (simpleType === 'expense') {
                    // 支出: 借方に費用科目
                    form.setFieldValue('debitAccount', val || '');
                    form.setFieldValue('debitSubaccount', '');
                    const accountId = val ? findAccountIdByName(val) : undefined;
                    const list = await fetchSubaccounts(accountId);
                    setDebitSubOptions(list.map(s => ({ value: s.name, label: s.name })));
                  } else {
                    // 振替: 貸方に振替元
                    form.setFieldValue('creditAccount', val || '');
                    form.setFieldValue('creditSubaccount', '');
                    const accountId = val ? findAccountIdByName(val) : undefined;
                    const list = await fetchSubaccounts(accountId);
                    setCreditSubOptions(list.map(s => ({ value: s.name, label: s.name })));
                  }
                }}
                error={simpleType === 'income' ? form.errors.creditAccount :
                       simpleType === 'expense' ? form.errors.debitAccount :
                       form.errors.creditAccount}
              />
              {/* 補助科目（科目選択後に表示） */}
              {((simpleType === 'income' && creditSubOptions.length > 0) ||
                (simpleType === 'expense' && debitSubOptions.length > 0) ||
                (simpleType === 'transfer' && creditSubOptions.length > 0)) && (
                <Select
                  label="補助科目"
                  placeholder="補助科目を選択"
                  data={simpleType === 'expense' ? debitSubOptions : creditSubOptions}
                  searchable
                  clearable
                  size="sm"
                  mt="xs"
                  value={simpleType === 'expense' ? form.values.debitSubaccount : form.values.creditSubaccount}
                  onChange={(val) => {
                    if (simpleType === 'expense') {
                      form.setFieldValue('debitSubaccount', val || '');
                    } else {
                      form.setFieldValue('creditSubaccount', val || '');
                    }
                  }}
                />
              )}
            </Grid.Col>

            {/* 取引手段 / 振替先 */}
            <Grid.Col span={6}>
              <Select
                label={
                  simpleType === 'income' ? '入金先' :
                  simpleType === 'expense' ? '支払方法' :
                  '振替先（増加）'
                }
                placeholder="科目を選択"
                data={
                  simpleType === 'transfer' ? groupedAccountOptions : assetAccountOptions
                }
                searchable
                required
                size="sm"
                value={simpleType === 'income' ? form.values.debitAccount :
                       simpleType === 'expense' ? form.values.creditAccount :
                       form.values.debitAccount}
                onChange={async (val) => {
                  if (simpleType === 'income') {
                    // 収入: 借方に資産科目
                    form.setFieldValue('debitAccount', val || '');
                    form.setFieldValue('debitSubaccount', '');
                    const accountId = val ? findAccountIdByName(val) : undefined;
                    const list = await fetchSubaccounts(accountId);
                    setDebitSubOptions(list.map(s => ({ value: s.name, label: s.name })));
                  } else if (simpleType === 'expense') {
                    // 支出: 貸方に資産科目
                    form.setFieldValue('creditAccount', val || '');
                    form.setFieldValue('creditSubaccount', '');
                    const accountId = val ? findAccountIdByName(val) : undefined;
                    const list = await fetchSubaccounts(accountId);
                    setCreditSubOptions(list.map(s => ({ value: s.name, label: s.name })));
                  } else {
                    // 振替: 借方に振替先
                    form.setFieldValue('debitAccount', val || '');
                    form.setFieldValue('debitSubaccount', '');
                    const accountId = val ? findAccountIdByName(val) : undefined;
                    const list = await fetchSubaccounts(accountId);
                    setDebitSubOptions(list.map(s => ({ value: s.name, label: s.name })));
                  }
                }}
                error={simpleType === 'income' ? form.errors.debitAccount :
                       simpleType === 'expense' ? form.errors.creditAccount :
                       form.errors.debitAccount}
              />
              {/* 補助科目（科目選択後に表示） */}
              {((simpleType === 'income' && debitSubOptions.length > 0) ||
                (simpleType === 'expense' && creditSubOptions.length > 0) ||
                (simpleType === 'transfer' && debitSubOptions.length > 0)) && (
                <Select
                  label="補助科目"
                  placeholder="補助科目を選択"
                  data={simpleType === 'expense' ? creditSubOptions : debitSubOptions}
                  searchable
                  clearable
                  size="sm"
                  mt="xs"
                  value={simpleType === 'expense' ? form.values.creditSubaccount : form.values.debitSubaccount}
                  onChange={(val) => {
                    if (simpleType === 'expense') {
                      form.setFieldValue('creditSubaccount', val || '');
                    } else {
                      form.setFieldValue('debitSubaccount', val || '');
                    }
                  }}
                />
              )}
            </Grid.Col>
          </Grid>

          {/* 金額 */}
          <NumberInput
            label="金額"
            placeholder="金額を入力"
            required
            allowNegative
            hideControls
            size="sm"
            thousandSeparator=","
            value={form.values.debitAmount}
            onChange={handleDebitAmountChange}
            error={form.errors.debitAmount}
          />

          {/* 摘要 */}
          <TextInput
            label="摘要"
            placeholder="取引の内容を入力"
            size="sm"
            onKeyDown={handleDescriptionKeyDown}
            {...form.getInputProps('description')}
          />

          {/* 登録ボタン */}
          <Button type="submit" loading={loading} fullWidth>
            登録
          </Button>
        </>
      )}

      {!simpleType && (
        <Paper p="xl" withBorder radius="md" style={{
          backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
          textAlign: 'center'
        }}>
          <Text c="dimmed">上から取引タイプを選択してください</Text>
        </Paper>
      )}
    </Stack>
  );

  return (
    <Stack gap="md">
      <Paper p="md" radius="md" withBorder>
        <form ref={formRef} onSubmit={form.onSubmit(handleSubmit)}>
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

      {/* 最近入力した仕訳一覧（編集モード以外で表示） */}
      {!isEditMode && recentEntries.length > 0 && (
        <Paper p="md" radius="md" withBorder>
          <Title order={4} mb="sm">最近入力した仕訳</Title>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>日付</Table.Th>
                <Table.Th>借方</Table.Th>
                <Table.Th>貸方</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>金額</Table.Th>
                <Table.Th>摘要</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {recentEntries.map((entry) => (
                <Table.Tr key={entry.id}>
                  <Table.Td>{entry.date}</Table.Td>
                  <Table.Td>
                    {entry.debit_account_name}
                    {entry.debit_subaccount_name && (
                      <Text span size="xs" c="dimmed" ml={4}>({entry.debit_subaccount_name})</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {entry.credit_account_name}
                    {entry.credit_subaccount_name && (
                      <Text span size="xs" c="dimmed" ml={4}>({entry.credit_subaccount_name})</Text>
                    )}
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>¥{entry.amount.toLocaleString()}</Table.Td>
                  <Table.Td>{entry.description}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}
    </Stack>
  );
};
