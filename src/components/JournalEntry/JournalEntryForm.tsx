import { useMemo, useState, useRef, forwardRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { Box, TextInput, Button, Select, Grid, Paper, Title, Alert, Stack, Text, SegmentedControl, Group, ActionIcon, useMantineTheme, useMantineColorScheme, Table, Combobox, useCombobox } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconEdit } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useAccounts } from '../../hooks/useAccounts';
import { useSubaccounts } from '../../hooks/useSubaccounts';
import { useJournalEntries } from '../../hooks/useJournalEntries';
import { useEntitlements } from '../../hooks/useEntitlements';

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
  onEdit?: (entry: {
    id: number;
    date: string;
    description: string;
    debit_account_name: string;
    credit_account_name: string;
    amount: number;
  }) => void;
}

// ─── 日付パーサー ───────────────────────────────────────────────────────────
// year: 'YYYY', monthDay: 'MMDD' / 'M/D' / 'MM/DD' など → 'YYYY-MM-DD' or null
const parseDate = (year: string, monthDay: string): string | null => {
  if (!/^\d{4}$/.test(year.trim())) return null;
  const yearNum = parseInt(year.trim(), 10);
  const cleanMD = monthDay.trim().replace(/\//g, '');
  if (!cleanMD || !/^\d+$/.test(cleanMD)) return null;

  let month: number, day: number;
  if (cleanMD.length === 3) {
    month = parseInt(cleanMD.slice(0, 1), 10);
    day = parseInt(cleanMD.slice(1), 10);
  } else if (cleanMD.length === 4) {
    month = parseInt(cleanMD.slice(0, 2), 10);
    day = parseInt(cleanMD.slice(2), 10);
  } else {
    return null;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(yearNum, month - 1, day);
  if (d.getFullYear() !== yearNum || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return `${yearNum}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

// ─── 月日フォーマッター ───────────────────────────────────────────────────────
// '0115' / '115' / '1/15' → '01/15'（無効な入力はそのまま返す）
const formatMonthDay = (input: string): string => {
  if (!input.trim()) return input;
  const cleanMD = input.trim().replace(/\//g, '');
  if (!/^\d+$/.test(cleanMD)) return input;
  let month: number, day: number;
  if (cleanMD.length === 3) {
    month = parseInt(cleanMD.slice(0, 1), 10);
    day = parseInt(cleanMD.slice(1), 10);
  } else if (cleanMD.length === 4) {
    month = parseInt(cleanMD.slice(0, 2), 10);
    day = parseInt(cleanMD.slice(2), 10);
  } else {
    return input;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return input;
  return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
};

// ─── AmountInput ─────────────────────────────────────────────────────────────
// 全角数字対応・blur/Enter 確定時に整形
interface AmountInputProps {
  value: number;
  onChange: (val: number) => void;
  onBlurAutoFill?: (val: number) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: React.ReactNode;
  size?: string;
}

const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(
  ({ value, onChange, onBlurAutoFill, onKeyDown: externalKeyDown, ...props }, ref) => {
    const fmt = (n: number) => (n === 0 ? '' : n.toLocaleString('ja-JP'));
    const [display, setDisplay] = useState(() => fmt(value));

    // フォームリセットなど外部からの value 変更を反映
    useEffect(() => { setDisplay(fmt(value)); }, [value]);

    const toHalf = (s: string) =>
      s.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
       .replace(/[－−]/g, '-'); // 全角マイナス・マイナス記号を半角へ

    const commit = (raw: string): number => {
      // コンマ除去・前後空白除去
      const half = toHalf(raw.trim()).replace(/,/g, '');
      // 先頭マイナス+数字のみ有効（例: -1000, 1000 は OK; abc-1000, -1000円 は NG）
      if (!/^-?\d+$/.test(half)) { setDisplay(''); onChange(0); return 0; }
      const n = parseInt(half, 10);
      setDisplay(n.toLocaleString('ja-JP'));
      onChange(n);
      return n;
    };

    return (
      <TextInput
        ref={ref}
        value={display}
        onChange={(e) => setDisplay(e.currentTarget.value)}
        onBlur={() => { const n = commit(display); onBlurAutoFill?.(n); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.nativeEvent.isComposing) commit(display);
          externalKeyDown?.(e);
        }}
        {...props}
      />
    );
  }
);
AmountInput.displayName = 'AmountInput';

// ─── AccountSelect ────────────────────────────────────────────────────────────
// フォーカスで即座に一覧表示・インライン検索・キーボードナビ・blur で自動クローズ
interface AccountSelectProps {
  value: string;
  onChange: (val: string) => void;
  data: Array<{ group: string; items: Array<{ value: string; label: string }> }>;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: React.ReactNode;
  size?: string;
  onEnterKey?: () => void;
  defaultHighlightValue?: string; // 未選択時にハイライトするデフォルト科目
}

const AccountSelect = forwardRef<HTMLInputElement, AccountSelectProps>(
  ({ value, onChange, data, placeholder = '科目を選択', label, required, error, size, onEnterKey, defaultHighlightValue }, ref) => {
    const dropdownOpenRef = useRef(false);
    const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const combobox = useCombobox({
      onDropdownClose: () => { combobox.resetSelectedOption(); dropdownOpenRef.current = false; },
      onDropdownOpen: () => { dropdownOpenRef.current = true; },
    });

    // selectedLabel: valueに対応するラベル
    const selectedLabel = data.flatMap((g) => g.items).find((i) => i.value === value)?.label ?? '';

    // inputValue: テキストボックスに表示する文字列
    // isFocused: フォーカス中かどうか（trueのとき inputValue が検索クエリになる）
    const [inputValue, setInputValue] = useState(selectedLabel);
    const [isFocused, setIsFocused] = useState(false);

    // 外部から value が変わったとき（フォームリセット等）に表示を同期
    useEffect(() => {
      if (!isFocused) setInputValue(selectedLabel);
    }, [selectedLabel, isFocused]);

    // フォーカス中は inputValue を検索クエリとして使う
    const search = isFocused ? inputValue : '';
    const filteredData = search
      ? data
          .map((g) => ({ ...g, items: g.items.filter((i) => i.label.toLowerCase().includes(search.toLowerCase())) }))
          .filter((g) => g.items.length > 0)
      : data;

    // active: 現在選択値 or 未検索時のデフォルトハイライト
    const activeValue = value || (!search ? (defaultHighlightValue ?? '') : '');

    const handleFocus = () => {
      clearTimeout(blurTimeoutRef.current);
      setIsFocused(true);
      setInputValue(''); // 検索のためにクリア
      combobox.openDropdown();
      // ドロップダウンがレンダリングされてから選択状態を設定（50ms待つ）
      setTimeout(() => {
        if (value || defaultHighlightValue) combobox.updateSelectedOptionIndex('active');
        else combobox.selectFirstOption();
      }, 50);
    };

    const handleBlur = () => {
      blurTimeoutRef.current = setTimeout(() => {
        setIsFocused(false);
        setInputValue(selectedLabel); // ラベルを復元
        combobox.closeDropdown();
      }, 150);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.currentTarget.value;
      setInputValue(v);
      combobox.openDropdown();
      setTimeout(() => {
        if (v) combobox.selectFirstOption();
        else if (value || defaultHighlightValue) combobox.updateSelectedOptionIndex('active');
        else combobox.selectFirstOption();
      }, 0);
    };

    // ArrowDown/ArrowUp/Enter（ドロップダウン開時）は Combobox.Target が処理するため除外
    // Escape・Tab・Enter（ドロップダウン閉時）のみ自前処理
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        setIsFocused(false);
        setInputValue(selectedLabel);
        combobox.closeDropdown();
      } else if (e.key === 'Tab') {
        setIsFocused(false);
        setInputValue(selectedLabel);
        combobox.closeDropdown();
      } else if (e.key === 'Enter' && !dropdownOpenRef.current) {
        e.preventDefault();
        onEnterKey?.();
      }
    };

    return (
      <Combobox
        store={combobox}
        onOptionSubmit={(val) => {
          clearTimeout(blurTimeoutRef.current);
          onChange(val);
          const newLabel = data.flatMap((g) => g.items).find((i) => i.value === val)?.label ?? '';
          setInputValue(newLabel);
          setIsFocused(false);
          combobox.closeDropdown();
        }}
      >
        <Combobox.Target>
          <TextInput
            ref={ref}
            label={label}
            required={required}
            error={error}
            size={size}
            value={inputValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rightSection={<Text size="sm" c="dimmed">▽</Text>}
            rightSectionPointerEvents="none"
            autoComplete="off"
          />
        </Combobox.Target>

        <Combobox.Dropdown>
          <Combobox.Options style={{ maxHeight: 260, overflowY: 'auto' }}>
            {filteredData.length === 0 ? (
              <Combobox.Empty>見つかりません</Combobox.Empty>
            ) : (
              filteredData.map((group) => (
                <Combobox.Group
                  key={group.group}
                  label={
                    <Text fw={700} size="xs" c="dimmed" style={{ textTransform: 'none' }}>
                      {group.group}
                    </Text>
                  }
                >
                  {group.items.map((item) => (
                    <Combobox.Option
                      key={item.value}
                      value={item.value}
                      active={item.value === activeValue}
                      style={{ paddingLeft: '24px' }}
                    >
                      {item.label}
                    </Combobox.Option>
                  ))}
                </Combobox.Group>
              ))
            )}
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
    );
  }
);
AccountSelect.displayName = 'AccountSelect';

// ─── JournalEntryForm ─────────────────────────────────────────────────────────
export const JournalEntryForm = ({ onSubmit, editData, onCancel, onEdit }: JournalEntryFormProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const { accounts } = useAccounts();
  const { journalEntries, createJournalEntry, updateJournalEntry, refetch: refetchJournalEntries } = useJournalEntries();
  const { fetchSubaccounts } = useSubaccounts();
  const { isPro } = useEntitlements();
  const [debitSubOptions, setDebitSubOptions] = useState<{ value: string; label: string }[]>([]);
  const [creditSubOptions, setCreditSubOptions] = useState<{ value: string; label: string }[]>([]);
  const [inputMode, setInputMode] = useState<InputMode>('transfer');
  const [simpleType, setSimpleType] = useState<SimpleType>(null);
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const formRef = useRef<HTMLFormElement>(null);

  // 日付: 年と月日を分けて管理
  const [yearValue, setYearValue] = useState<string>(() =>
    editData ? editData.date.slice(0, 4) : String(new Date().getFullYear())
  );
  const [monthDayValue, setMonthDayValue] = useState<string>(() => {
    if (editData) {
      const p = editData.date.split('-');
      return `${p[1]}/${p[2]}`;
    }
    return '';
  });

  // 入力フィールド ref
  const yearRef = useRef<HTMLInputElement>(null);
  const monthDayRef = useRef<HTMLInputElement>(null);
  const debitAccountRef = useRef<HTMLInputElement>(null);
  const creditAccountRef = useRef<HTMLInputElement>(null);
  const debitAmountRef = useRef<HTMLInputElement>(null);
  const creditAmountRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);
  const simpleAmountRef = useRef<HTMLInputElement>(null);

  // 摘要 Enter → 送信
  const handleDescriptionKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); formRef.current?.requestSubmit(); }
  };

  // Enter → 次フィールドへ
  const handleEnterToNext = (nextRef: React.RefObject<HTMLElement | null>) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      setTimeout(() => nextRef.current?.focus(), 10);
    }
  };

  const isEditMode = !!editData;

  const form = useForm({
    initialValues: {
      description: editData?.description || '',
      debitAccount: editData?.debit_account_name || '',
      debitSubaccount: '',
      creditAccount: editData?.credit_account_name || '',
      creditSubaccount: '',
      debitAmount: editData?.amount || 0,
      creditAmount: editData?.amount || 0,
    },
    validate: {
      description: undefined,
      debitAccount: (v: string) => (v.length < 1 ? '借方勘定を選択してください' : null),
      creditAccount: (v: string) => (v.length < 1 ? '貸方勘定を選択してください' : null),
      debitAmount: (v: number) => (v === 0 ? '借方金額を入力してください' : null),
      creditAmount: (v: number, vals) => {
        if (v === 0) return '貸方金額を入力してください';
        if (v !== vals.debitAmount) return '借方金額と貸方金額が一致しません';
        return null;
      },
    },
  });

  // 勘定科目グループ
  const groupedAccountOptions = accounts ? [
    { group: '資産',   items: accounts.assets.map(a => ({ value: a.name, label: a.name })) },
    { group: '負債',   items: accounts.liabilities.map(a => ({ value: a.name, label: a.name })) },
    { group: '純資産', items: accounts.equity.map(a => ({ value: a.name, label: a.name })) },
    { group: '収益',   items: accounts.revenue.map(a => ({ value: a.name, label: a.name })) },
    { group: '費用',   items: accounts.expenses.map(a => ({ value: a.name, label: a.name })) },
  ] : [];

  const assetAccountOptions   = accounts ? [{ group: '資産', items: accounts.assets.map(a => ({ value: a.name, label: a.name })) }] : [];
  const revenueAccountOptions = accounts ? [{ group: '収益', items: accounts.revenue.map(a => ({ value: a.name, label: a.name })) }] : [];
  const expenseAccountOptions = accounts ? [{ group: '費用', items: accounts.expenses.map(a => ({ value: a.name, label: a.name })) }] : [];

  const findAccountIdByName = useMemo(() => {
    if (!accounts) return (_n: string) => undefined as number | undefined;
    const m = new Map<string, number>();
    [...accounts.assets, ...accounts.liabilities, ...accounts.equity, ...accounts.revenue, ...accounts.expenses]
      .forEach(a => m.set(a.name, a.id));
    return (name: string) => m.get(name);
  }, [accounts]);

  const recentEntries = useMemo(() => {
    if (!journalEntries || journalEntries.length === 0) return [];
    return [...journalEntries]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [journalEntries]);

  // 直前仕訳の科目（デフォルトハイライト用）
  const lastDebitAccount  = recentEntries[0]?.debit_account_name;
  const lastCreditAccount = recentEntries[0]?.credit_account_name;

  // ─── handleSubmit ───────────────────────────────────────────────────────────
  const handleSubmit = async (values: typeof form.values) => {
    (document.activeElement as HTMLElement)?.blur();

    const dateStr = parseDate(yearValue, monthDayValue);
    if (!dateStr) {
      setDateError('正しい日付を入力してください。例：年「2026」、月日「0115」');
      return;
    }
    setDateError(null);
    setLoading(true);
    setError(null);

    try {
      const entryData = {
        date: dateStr,
        description: values.description,
        debitAccount: values.debitAccount,
        debitSubaccount: values.debitSubaccount || null,
        creditAccount: values.creditAccount,
        creditSubaccount: values.creditSubaccount || null,
        amount: values.debitAmount,
      };

      if (isEditMode && editData) {
        await updateJournalEntry({ id: editData.id, ...entryData });
      } else {
        await createJournalEntry(entryData);
      }

      if (onSubmit) onSubmit({ date: null, ...values }, isEditMode);
      refetchJournalEntries();

      if (!isEditMode) {
        // 月日は保持したまま、全選択状態でフォーカス
        form.reset();
        setDebitSubOptions([]);
        setCreditSubOptions([]);
        setSimpleType(null);
        notifications.show({ title: '登録完了', message: '仕訳を登録しました', color: 'green', autoClose: 2000 });
        setTimeout(() => {
          if (monthDayRef.current) {
            monthDayRef.current.focus();
            monthDayRef.current.select();
          }
        }, 50);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 借方金額のみ更新（貸方に自動同期しない）
  const handleDebitAmountChange = (val: number) => form.setFieldValue('debitAmount', val);
  const handleCreditAmountChange = (val: number) => form.setFieldValue('creditAmount', val);
  // 借方 blur 時: 貸方が 0 なら自動補完
  const handleDebitAmountBlur = (val: number) => {
    if (form.values.creditAmount === 0) form.setFieldValue('creditAmount', val);
  };

  // ─── 日付入力パーツ（全モード共通） ──────────────────────────────────────
  const renderDateInputs = () => (
    <Grid mb="md">
      <Grid.Col span={2}>
        <TextInput
          ref={yearRef}
          label="年"
          placeholder="2026"
          value={yearValue}
          maxLength={4}
          onChange={(e) => setYearValue(e.currentTarget.value)}
          error={dateError ? ' ' : undefined}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              e.preventDefault();
              setTimeout(() => monthDayRef.current?.focus(), 10);
            }
          }}
        />
      </Grid.Col>
      <Grid.Col span={2}>
        <TextInput
          ref={monthDayRef}
          label="月日"
          value={monthDayValue}
          maxLength={5}
          onChange={(e) => setMonthDayValue(e.currentTarget.value)}
          error={dateError ?? undefined}
          onBlur={() => {
            const formatted = formatMonthDay(monthDayValue);
            setMonthDayValue(formatted);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              e.preventDefault();
              const formatted = formatMonthDay(monthDayValue);
              setMonthDayValue(formatted);
              setTimeout(() => debitAccountRef.current?.focus(), 10);
            }
          }}
        />
      </Grid.Col>
    </Grid>
  );

  // ─── 振替伝票モード ──────────────────────────────────────────────────────
  const renderTransferMode = () => (
    <>
      {renderDateInputs()}

      <Grid mb="md">
        {/* 借方 */}
        <Grid.Col span={6}>
          <Paper p="xl" withBorder radius="md">
            <Text size="sm" fw={600} c="teal" mb="lg" style={{ fontSize: '16px', letterSpacing: '0.5px' }}>借方</Text>
            <Stack gap="md">
              <AccountSelect
                ref={debitAccountRef}
                label="借方科目"
                data={groupedAccountOptions}
                required
                value={form.values.debitAccount}
                error={form.errors.debitAccount}
                defaultHighlightValue={!form.values.debitAccount ? lastDebitAccount : undefined}
                onChange={async (val) => {
                  form.setFieldValue('debitAccount', val);
                  form.setFieldValue('debitSubaccount', '');
                  const list = await fetchSubaccounts(findAccountIdByName(val));
                  setDebitSubOptions(list.map(s => ({ value: s.name, label: s.name })));
                }}
                onEnterKey={() => setTimeout(() => debitAmountRef.current?.focus(), 10)}
              />
              {isPro && (
                <Select
                  label="補助科目"
                  placeholder={debitSubOptions.length === 0 ? '補助科目なし' : '補助科目を選択'}
                  data={debitSubOptions} searchable clearable
                  disabled={debitSubOptions.length === 0}
                  {...form.getInputProps('debitSubaccount')}
                />
              )}
              <AmountInput
                ref={debitAmountRef}
                label="借方金額" placeholder="金額を入力" required
                value={form.values.debitAmount}
                onChange={handleDebitAmountChange}
                onBlurAutoFill={handleDebitAmountBlur}
                error={form.errors.debitAmount}
                onKeyDown={handleEnterToNext(creditAccountRef)}
              />
            </Stack>
          </Paper>
        </Grid.Col>

        {/* 貸方 */}
        <Grid.Col span={6}>
          <Paper p="xl" withBorder radius="md">
            <Text size="sm" fw={600} c="pink" mb="lg" style={{ fontSize: '16px', letterSpacing: '0.5px' }}>貸方</Text>
            <Stack gap="md">
              <AccountSelect
                ref={creditAccountRef}
                label="貸方科目"
                data={groupedAccountOptions}
                required
                value={form.values.creditAccount}
                error={form.errors.creditAccount}
                defaultHighlightValue={!form.values.creditAccount ? lastCreditAccount : undefined}
                onChange={async (val) => {
                  form.setFieldValue('creditAccount', val);
                  form.setFieldValue('creditSubaccount', '');
                  const list = await fetchSubaccounts(findAccountIdByName(val));
                  setCreditSubOptions(list.map(s => ({ value: s.name, label: s.name })));
                }}
                onEnterKey={() => setTimeout(() => creditAmountRef.current?.focus(), 10)}
              />
              {isPro && (
                <Select
                  label="補助科目"
                  placeholder={creditSubOptions.length === 0 ? '補助科目なし' : '補助科目を選択'}
                  data={creditSubOptions} searchable clearable
                  disabled={creditSubOptions.length === 0}
                  {...form.getInputProps('creditSubaccount')}
                />
              )}
              <AmountInput
                ref={creditAmountRef}
                label="貸方金額" placeholder="金額を入力" required
                value={form.values.creditAmount}
                onChange={handleCreditAmountChange}
                error={form.errors.creditAmount}
                onKeyDown={handleEnterToNext(descriptionRef)}
              />
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>

      <TextInput
        ref={descriptionRef}
        label="摘要" placeholder="取引の内容を入力（Enterで登録）" mb="md"
        onKeyDown={handleDescriptionKeyDown}
        {...form.getInputProps('description')}
      />
    </>
  );

  // ─── 仕訳帳モード ────────────────────────────────────────────────────────
  const renderJournalMode = () => (
    <>
      {renderDateInputs()}

      <Paper withBorder radius="md" mb="md" style={{ overflow: 'hidden' }}>
        <Box style={{
          display: 'grid',
          gridTemplateColumns: '1fr 120px 1fr 120px',
          gap: '1px',
          backgroundColor: colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3],
        }}>
          {/* ヘッダー */}
          {(['借方科目', '借方金額', '貸方科目', '貸方金額'] as const).map((h) => (
            <Box key={h} p="xs" style={{ backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[1] }}>
              <Text size="sm" fw={600} ta="center">{h}</Text>
            </Box>
          ))}

          {/* 入力行 */}
          <Box p="xs" style={{ backgroundColor: colorScheme === 'dark' ? theme.colors.dark[7] : 'white' }}>
            <AccountSelect
              ref={debitAccountRef} size="sm"
              data={groupedAccountOptions}
              value={form.values.debitAccount}
              error={form.errors.debitAccount}
              defaultHighlightValue={!form.values.debitAccount ? lastDebitAccount : undefined}
              onChange={async (val) => {
                form.setFieldValue('debitAccount', val);
                form.setFieldValue('debitSubaccount', '');
                const list = await fetchSubaccounts(findAccountIdByName(val));
                setDebitSubOptions(list.map(s => ({ value: s.name, label: s.name })));
              }}
              onEnterKey={() => setTimeout(() => debitAmountRef.current?.focus(), 10)}
            />
          </Box>
          <Box p="xs" style={{ backgroundColor: colorScheme === 'dark' ? theme.colors.dark[7] : 'white' }}>
            <AmountInput
              ref={debitAmountRef} placeholder="金額" size="sm"
              value={form.values.debitAmount}
              onChange={handleDebitAmountChange}
              onBlurAutoFill={handleDebitAmountBlur}
              error={form.errors.debitAmount}
              onKeyDown={handleEnterToNext(creditAccountRef)}
            />
          </Box>
          <Box p="xs" style={{ backgroundColor: colorScheme === 'dark' ? theme.colors.dark[7] : 'white' }}>
            <AccountSelect
              ref={creditAccountRef} size="sm"
              data={groupedAccountOptions}
              value={form.values.creditAccount}
              error={form.errors.creditAccount}
              defaultHighlightValue={!form.values.creditAccount ? lastCreditAccount : undefined}
              onChange={async (val) => {
                form.setFieldValue('creditAccount', val);
                form.setFieldValue('creditSubaccount', '');
                const list = await fetchSubaccounts(findAccountIdByName(val));
                setCreditSubOptions(list.map(s => ({ value: s.name, label: s.name })));
              }}
              onEnterKey={() => setTimeout(() => creditAmountRef.current?.focus(), 10)}
            />
          </Box>
          <Box p="xs" style={{ backgroundColor: colorScheme === 'dark' ? theme.colors.dark[7] : 'white' }}>
            <AmountInput
              ref={creditAmountRef} placeholder="金額" size="sm"
              value={form.values.creditAmount}
              onChange={handleCreditAmountChange}
              error={form.errors.creditAmount}
              onKeyDown={handleEnterToNext(descriptionRef)}
            />
          </Box>
        </Box>
      </Paper>

      {isPro && (
        <Grid mb="md">
          <Grid.Col span={6}>
            <Select label="借方補助科目" placeholder={debitSubOptions.length === 0 ? '補助科目なし' : '補助科目を選択'}
              data={debitSubOptions} searchable clearable disabled={debitSubOptions.length === 0}
              {...form.getInputProps('debitSubaccount')} />
          </Grid.Col>
          <Grid.Col span={6}>
            <Select label="貸方補助科目" placeholder={creditSubOptions.length === 0 ? '補助科目なし' : '補助科目を選択'}
              data={creditSubOptions} searchable clearable disabled={creditSubOptions.length === 0}
              {...form.getInputProps('creditSubaccount')} />
          </Grid.Col>
        </Grid>
      )}

      <TextInput
        ref={descriptionRef}
        label="摘要" placeholder="取引の内容を入力（Enterで登録）" mb="md"
        onKeyDown={handleDescriptionKeyDown}
        {...form.getInputProps('description')}
      />
    </>
  );

  // ─── 簡単入力モード ──────────────────────────────────────────────────────
  const renderSimpleMode = () => {
    const blockStyle: React.CSSProperties = {
      maxWidth: 600,
      width: '100%',
      alignSelf: 'center',
    };
    const blockHeaderStyle: React.CSSProperties = {
      fontSize: '12px',
      fontWeight: 700,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      color: 'var(--mantine-color-dimmed)',
      marginBottom: 12,
    };

    return (
    <Stack gap="lg" align="stretch">

      {/* ブロック1: 取引区分 */}
      <Box style={blockStyle}>
        <SegmentedControl
          value={simpleType || ''}
          onChange={(v) => {
            setSimpleType(v as SimpleType);
            form.setFieldValue('debitAccount', '');
            form.setFieldValue('creditAccount', '');
            form.setFieldValue('debitSubaccount', '');
            form.setFieldValue('creditSubaccount', '');
            setDebitSubOptions([]); setCreditSubOptions([]);
          }}
          data={[{ label: '収益（収入）', value: 'income' }, { label: '費用（支出）', value: 'expense' }, { label: '振替', value: 'transfer' }]}
          fullWidth size="md"
        />
      </Box>

      {/* ブロック2: 日付 */}
      <Paper p="md" withBorder radius="md" style={blockStyle}>
        <Text style={blockHeaderStyle}>日付</Text>
        <Group gap="xs" align="flex-end">
          <TextInput
            ref={yearRef}
            label="年"
            placeholder="2026"
            value={yearValue}
            maxLength={4}
            style={{ width: 80 }}
            onChange={(e) => setYearValue(e.currentTarget.value)}
            error={dateError ? ' ' : undefined}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault();
                setTimeout(() => monthDayRef.current?.focus(), 10);
              }
            }}
          />
          <Text size="sm" c="dimmed" mb={6}>年</Text>
          <TextInput
            ref={monthDayRef}
            label="月日"
            placeholder="0324"
            value={monthDayValue}
            maxLength={5}
            style={{ width: 90 }}
            onChange={(e) => setMonthDayValue(e.currentTarget.value)}
            error={dateError ?? undefined}
            onBlur={() => setMonthDayValue(formatMonthDay(monthDayValue))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault();
                setMonthDayValue(formatMonthDay(monthDayValue));
                setTimeout(() => debitAccountRef.current?.focus(), 10);
              }
            }}
          />
          <Text size="sm" c="dimmed" mb={6}>月日</Text>
        </Group>
        {dateError && <Text size="xs" c="red" mt={4}>{dateError}</Text>}
      </Paper>

      {/* ブロック3: 取引内容 */}
      <Paper p="md" withBorder radius="md" style={blockStyle}>
        <Text style={blockHeaderStyle}>取引内容</Text>
        {simpleType ? (
          <Stack gap="sm">
            <AccountSelect
              ref={debitAccountRef}
              label={simpleType === 'income' ? '収益（収入）の種類' : simpleType === 'expense' ? '費用（支出）の種類' : '振替元'}
              required
              data={simpleType === 'income' ? revenueAccountOptions : simpleType === 'expense' ? expenseAccountOptions : groupedAccountOptions}
              value={simpleType === 'income' ? form.values.creditAccount : simpleType === 'expense' ? form.values.debitAccount : form.values.creditAccount}
              onChange={async (val) => {
                if (simpleType === 'income') {
                  form.setFieldValue('creditAccount', val); form.setFieldValue('creditSubaccount', '');
                  const list = await fetchSubaccounts(findAccountIdByName(val));
                  setCreditSubOptions(list.map(s => ({ value: s.name, label: s.name })));
                } else if (simpleType === 'expense') {
                  form.setFieldValue('debitAccount', val); form.setFieldValue('debitSubaccount', '');
                  const list = await fetchSubaccounts(findAccountIdByName(val));
                  setDebitSubOptions(list.map(s => ({ value: s.name, label: s.name })));
                } else {
                  form.setFieldValue('creditAccount', val); form.setFieldValue('creditSubaccount', '');
                  const list = await fetchSubaccounts(findAccountIdByName(val));
                  setCreditSubOptions(list.map(s => ({ value: s.name, label: s.name })));
                }
              }}
              onEnterKey={() => setTimeout(() => creditAccountRef.current?.focus(), 10)}
              error={simpleType === 'income' ? form.errors.creditAccount : simpleType === 'expense' ? form.errors.debitAccount : form.errors.creditAccount}
            />
            {isPro && ((simpleType === 'income' && creditSubOptions.length > 0) || (simpleType === 'expense' && debitSubOptions.length > 0) || (simpleType === 'transfer' && creditSubOptions.length > 0)) && (
              <Select label="補助科目" placeholder="補助科目を選択"
                data={simpleType === 'expense' ? debitSubOptions : creditSubOptions}
                searchable clearable size="sm"
                value={simpleType === 'expense' ? form.values.debitSubaccount : form.values.creditSubaccount}
                onChange={(v) => { if (simpleType === 'expense') form.setFieldValue('debitSubaccount', v || ''); else form.setFieldValue('creditSubaccount', v || ''); }}
              />
            )}
            <AccountSelect
              ref={creditAccountRef}
              label={simpleType === 'income' ? '入金先' : simpleType === 'expense' ? '支払方法' : '振替先'}
              required
              data={simpleType === 'transfer' ? groupedAccountOptions : assetAccountOptions}
              value={simpleType === 'income' ? form.values.debitAccount : simpleType === 'expense' ? form.values.creditAccount : form.values.debitAccount}
              onChange={async (val) => {
                if (simpleType === 'income') {
                  form.setFieldValue('debitAccount', val); form.setFieldValue('debitSubaccount', '');
                  const list = await fetchSubaccounts(findAccountIdByName(val));
                  setDebitSubOptions(list.map(s => ({ value: s.name, label: s.name })));
                } else if (simpleType === 'expense') {
                  form.setFieldValue('creditAccount', val); form.setFieldValue('creditSubaccount', '');
                  const list = await fetchSubaccounts(findAccountIdByName(val));
                  setCreditSubOptions(list.map(s => ({ value: s.name, label: s.name })));
                } else {
                  form.setFieldValue('debitAccount', val); form.setFieldValue('debitSubaccount', '');
                  const list = await fetchSubaccounts(findAccountIdByName(val));
                  setDebitSubOptions(list.map(s => ({ value: s.name, label: s.name })));
                }
              }}
              onEnterKey={() => setTimeout(() => simpleAmountRef.current?.focus(), 10)}
              error={simpleType === 'income' ? form.errors.debitAccount : simpleType === 'expense' ? form.errors.creditAccount : form.errors.debitAccount}
            />
            {isPro && ((simpleType === 'income' && debitSubOptions.length > 0) || (simpleType === 'expense' && creditSubOptions.length > 0) || (simpleType === 'transfer' && debitSubOptions.length > 0)) && (
              <Select label="補助科目" placeholder="補助科目を選択"
                data={simpleType === 'expense' ? creditSubOptions : debitSubOptions}
                searchable clearable size="sm"
                value={simpleType === 'expense' ? form.values.creditSubaccount : form.values.debitSubaccount}
                onChange={(v) => { if (simpleType === 'expense') form.setFieldValue('creditSubaccount', v || ''); else form.setFieldValue('debitSubaccount', v || ''); }}
              />
            )}
            <AmountInput
              ref={simpleAmountRef}
              label="金額" placeholder="金額を入力" required
              value={form.values.debitAmount}
              onChange={handleDebitAmountChange}
              onBlurAutoFill={handleDebitAmountBlur}
              error={form.errors.debitAmount}
            />
          </Stack>
        ) : (
          <Text c="dimmed" size="sm" ta="center" py="md">上の取引区分を選択してください</Text>
        )}
      </Paper>

      {/* ブロック4: 摘要・登録 */}
      <Paper p="md" withBorder radius="md" style={blockStyle}>
        <Text style={blockHeaderStyle}>摘要・登録</Text>
        <Stack gap="sm">
          <TextInput
            label="摘要"
            placeholder="取引の内容を入力"
            onKeyDown={handleDescriptionKeyDown}
            {...form.getInputProps('description')}
          />
          <Group justify="flex-end">
            <Button
              type="submit"
              loading={loading}
              disabled={!simpleType}
              style={{ minWidth: 160, maxWidth: 240 }}
            >
              登録
            </Button>
          </Group>
        </Stack>
      </Paper>

    </Stack>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <Stack gap="md">
      <Paper p="md" radius="md" withBorder>
        <form ref={formRef} onSubmit={form.onSubmit(handleSubmit)}>
          {!isEditMode && (
            <Group justify="flex-end" mb="md">
              <SegmentedControl
                value={inputMode}
                onChange={(v) => setInputMode(v as InputMode)}
                data={[{ label: '振替伝票', value: 'transfer' }, { label: '仕訳帳', value: 'journal' }, { label: '簡単入力', value: 'simple' }]}
              />
            </Group>
          )}

          {error && (
            <Alert icon={<IconAlertCircle size="1rem" />} title="エラー" color="red" mb="md">{error}</Alert>
          )}

          {inputMode === 'transfer' && renderTransferMode()}
          {inputMode === 'journal' && renderJournalMode()}
          {inputMode === 'simple' && renderSimpleMode()}

          {inputMode !== 'simple' && (
            <Box style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              {isEditMode && onCancel && (
                <Button variant="outline" size="md" onClick={onCancel}>キャンセル</Button>
              )}
              <Button type="submit" size="md" loading={loading}>{isEditMode ? '更新' : '登録'}</Button>
            </Box>
          )}
        </form>
      </Paper>

      {/* 最近入力した仕訳 */}
      {!isEditMode && recentEntries.length > 0 && (
        <Paper p="md" radius="md" withBorder>
          <Title order={4} mb="sm">最近入力した仕訳</Title>
          <Table striped highlightOnHover withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: '100px' }}>日付</Table.Th>
                <Table.Th style={{ width: '160px' }}>借方勘定科目</Table.Th>
                <Table.Th style={{ textAlign: 'right', width: '90px' }}>金額</Table.Th>
                <Table.Th style={{ width: '160px' }}>貸方勘定科目</Table.Th>
                <Table.Th style={{ textAlign: 'right', width: '90px' }}>金額</Table.Th>
                <Table.Th>摘要</Table.Th>
                <Table.Th style={{ width: '50px' }}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {recentEntries.map((entry) => (
                <Table.Tr key={entry.id}>
                  <Table.Td>{new Date(entry.date + 'T00:00:00').toLocaleDateString('ja-JP')}</Table.Td>
                  <Table.Td style={{ fontWeight: 500 }}>
                    {entry.debit_account_name}
                    {entry.debit_subaccount_name && <Text span size="xs" c="dimmed" ml={4}>（{entry.debit_subaccount_name}）</Text>}
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'right', fontWeight: 600, fontSize: '14px' }}>
                    {entry.amount.toLocaleString()}
                  </Table.Td>
                  <Table.Td style={{ fontWeight: 500 }}>
                    {entry.credit_account_name}
                    {entry.credit_subaccount_name && <Text span size="xs" c="dimmed" ml={4}>（{entry.credit_subaccount_name}）</Text>}
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'right', fontWeight: 600, fontSize: '14px' }}>
                    {entry.amount.toLocaleString()}
                  </Table.Td>
                  <Table.Td>{entry.description}</Table.Td>
                  <Table.Td>
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={() => onEdit?.(entry)}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}
    </Stack>
  );
};
