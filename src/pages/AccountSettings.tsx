import { useState, useEffect, useCallback } from 'react';
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Stack,
  Title,
  Paper,
  Button,
  Group,
  ActionIcon,
  Modal,
  Select,
  TextInput,
  Box,
  Alert,
  Loader,
  Text,
  useMantineTheme,
  useMantineColorScheme,
  SegmentedControl,
  Skeleton,
  Badge,
  Switch,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconGripVertical,
  IconLock,
} from '@tabler/icons-react';
import { useAccounts } from '../hooks/useAccounts';
import { useSubaccounts } from '../hooks/useSubaccounts';
import { useEntitlements } from '../hooks/useEntitlements';

// 勘定科目の種類の定義
const ACCOUNT_TYPES = {
  ASSETS: '資産',
  LIABILITIES: '負債',
  EQUITY: '純資産',
  REVENUE: '収益',
  EXPENSES: '費用',
} as const;

// APIから返されるキーを日本語に変換するマッピング
const ACCOUNT_TYPE_LABELS = {
  assets: '資産',
  liabilities: '負債',
  equity: '純資産',
  revenue: '収益',
  expenses: '費用',
} as const;

// ─── Sortable row wrapper ───────────────────────────────────────────────────
interface SortableRowProps {
  id: string;
  children: (dragHandle: React.ReactNode) => React.ReactNode;
}

function SortableRow({ id, children }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const dragHandle = (
    <ActionIcon
      size="sm"
      variant="subtle"
      color="gray"
      style={{ cursor: 'grab', touchAction: 'none' }}
      {...listeners}
      {...attributes}
    >
      <IconGripVertical size={16} />
    </ActionIcon>
  );
  return (
    <div ref={setNodeRef} style={style}>
      {children(dragHandle)}
    </div>
  );
}

export default function AccountSettings() {
  const { isPro } = useEntitlements();
  const { accounts, loading, error, createAccount, updateAccount, deleteAccount, deactivateAccount, reactivateAccount, reorderAccounts, refetch } = useAccounts();
  const { fetchSubaccounts, createSubaccount, updateSubaccount, deleteSubaccount } = useSubaccounts();
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [accountName, setAccountName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 表示切り替え: 'balance' = 貸借対照表（資産・負債・純資産）, 'income' = 損益計算書（収益・費用）
  const [viewMode, setViewMode] = useState<'balance' | 'income'>('balance');

  // Subaccount management state
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [subTargetAccount, setSubTargetAccount] = useState<{ id: number; name: string } | null>(null);
  const [subList, setSubList] = useState<{ id: number; name: string }[]>([]);
  const [subName, setSubName] = useState('');
  const [subEditingId, setSubEditingId] = useState<number | null>(null);
  const [subSubmitting, setSubSubmitting] = useState(false);

  // インライン編集の状態
  const [inlineEditingId, setInlineEditingId] = useState<number | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState('');
  const [inlineEditType, setInlineEditType] = useState('');

  // 使用停止関連の状態
  const [deactivateTargetAccount, setDeactivateTargetAccount] = useState<{ id: number; name: string } | null>(null);
  const [showInactiveAccounts, setShowInactiveAccounts] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  // 補助科目のキャッシュ（勘定科目ID → 補助科目リスト）
  const [subaccountsCache, setSubaccountsCache] = useState<Record<number, { id: number; name: string }[]>>({});
  const [loadingSubaccounts, setLoadingSubaccounts] = useState<Record<number, boolean>>({});
  const [accountOrder, setAccountOrder] = useState<Record<string, number[]>>(() => {
    try {
      const saved = localStorage.getItem('account-order');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const surfaceBg = colorScheme === 'dark' ? theme.colors.dark[6] : '#f8f9fa';
  const surfaceBorder = colorScheme === 'dark' ? '1px solid rgba(255,255,255,0.15)' : '1px solid #e9ecef';
  const surfaceTextMuted = colorScheme === 'dark' ? theme.colors.gray[6] : '#6c757d';
  const subaccountBg = colorScheme === 'dark' ? theme.colors.dark[7] : '#fff';

  // ─── DnD sensors ──────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent, type: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setAccountOrder((prev) => {
      const list = [...(prev[type] || [])];
      const oldIndex = list.indexOf(Number(active.id));
      const newIndex = list.indexOf(Number(over.id));
      if (oldIndex === -1 || newIndex === -1) return prev;
      const newList = arrayMove(list, oldIndex, newIndex);
      const updates = newList.map((id, index) => ({ id, sort_order: index }));
      reorderAccounts(updates).catch(console.error);
      return { ...prev, [type]: newList };
    });
  };

  // 補助科目を読み込む
  const loadSubaccounts = useCallback(async (accountId: number) => {
    if (subaccountsCache[accountId] || loadingSubaccounts[accountId]) return;

    setLoadingSubaccounts(prev => ({ ...prev, [accountId]: true }));
    try {
      const list = await fetchSubaccounts(accountId);
      setSubaccountsCache(prev => ({ ...prev, [accountId]: list.map(s => ({ id: s.id, name: s.name })) }));
    } catch (e) {
      setSubaccountsCache(prev => ({ ...prev, [accountId]: [] }));
    } finally {
      setLoadingSubaccounts(prev => ({ ...prev, [accountId]: false }));
    }
  }, [fetchSubaccounts, subaccountsCache, loadingSubaccounts]);

  // 初回ロード時に全ての補助科目を取得
  useEffect(() => {
    if (!accounts) return;
    const allAccounts = [
      ...accounts.assets,
      ...accounts.liabilities,
      ...accounts.equity,
      ...accounts.revenue,
      ...accounts.expenses,
    ];
    allAccounts.forEach(account => {
      loadSubaccounts(account.id);
    });
  }, [accounts]);

  // 勘定科目の並び順を初期化/同期
  useEffect(() => {
    if (!accounts) return;
    setAccountOrder((prev) => {
      const next: Record<string, number[]> = { ...prev };
      (Object.keys(accounts) as Array<keyof typeof accounts>).forEach((type) => {
        const ids = accounts[type].map((account) => account.id);
        const current = (prev[type] || []).filter((id) => ids.includes(id));
        const missing = ids.filter((id) => !current.includes(id));
        next[type] = [...current, ...missing];
      });
      return next;
    });
  }, [accounts]);

  useEffect(() => {
    try {
      localStorage.setItem('account-order', JSON.stringify(accountOrder));
    } catch {
      // ignore
    }
  }, [accountOrder]);

  const openSubaccountManager = async (account: { id: number; name: string }) => {
    setSubTargetAccount({ id: account.id, name: account.name });
    setSubModalOpen(true);
    setSubEditingId(null);
    setSubName('');
    try {
      const list = await fetchSubaccounts(account.id);
      setSubList(list.map(s => ({ id: s.id, name: s.name })));
    } catch {
      setSubList([]);
    }
  };

  // インライン編集を開始
  const startInlineEdit = (account: { id: number; name: string; type: string }) => {
    setInlineEditingId(account.id);
    setInlineEditValue(account.name);
    setInlineEditType(account.type);
  };

  // インライン編集を保存
  const saveInlineEdit = async () => {
    if (!inlineEditingId || !inlineEditValue.trim()) {
      setInlineEditingId(null);
      return;
    }

    try {
      setIsSubmitting(true);
      await updateAccount(inlineEditingId, inlineEditValue, inlineEditType as any);
      setInlineEditingId(null);
      setInlineEditValue('');
    } catch (err) {
      console.error('Error updating account:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // インライン編集をキャンセル
  const cancelInlineEdit = () => {
    setInlineEditingId(null);
    setInlineEditValue('');
  };

  const handleAddAccount = async () => {
    if (!selectedType || !accountName.trim()) return;

    try {
      setIsSubmitting(true);
      await createAccount(accountName, selectedType as any);
      setSelectedType(null);
      setAccountName('');
      close();
    } catch (err) {
      console.error('Error creating account:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async (id: number, name: string) => {
    if (!confirm('この勘定科目を削除しますか？')) return;

    try {
      await deleteAccount(id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('409')) {
        // 使用中のため削除不可 → 使用停止モーダルを表示
        setDeactivateTargetAccount({ id, name });
      } else {
        console.error('Error deleting account:', err);
      }
    }
  };

  const handleDeactivateAccount = async () => {
    if (!deactivateTargetAccount) return;
    setDeactivating(true);
    try {
      await deactivateAccount(deactivateTargetAccount.id);
      setDeactivateTargetAccount(null);
    } catch (err) {
      console.error('Error deactivating account:', err);
    } finally {
      setDeactivating(false);
    }
  };

  const handleToggleInactiveAccounts = async (checked: boolean) => {
    setShowInactiveAccounts(checked);
    await refetch(checked);
  };

  const handleReactivateAccount = async (id: number) => {
    try {
      await reactivateAccount(id);
      // 停止中科目を表示中なら再取得して一覧を更新
      await refetch(showInactiveAccounts);
    } catch (err) {
      console.error('Error reactivating account:', err);
    }
  };

  const handleCloseModal = () => {
    close();
    setSelectedType(null);
    setAccountName('');
  };

  if (loading) {
    return (
      <Stack gap="md">
        <Group justify="flex-end">
          <Group gap="sm">
            <Skeleton height={32} width={160} radius="sm" />
            <Skeleton height={32} width={96} radius="sm" />
          </Group>
        </Group>
        <Paper shadow="xs" p="md" radius="md">
          <Stack gap="md">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} height={36} radius="sm" />
            ))}
          </Stack>
        </Paper>
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} title="エラー" color="red">
        {error}
      </Alert>
    );
  }

  if (!accounts) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} title="エラー" color="red">
        勘定科目データを取得できませんでした
      </Alert>
    );
  }

  // 表示モードに応じて表示する勘定科目タイプをフィルタリング
  const filteredAccountTypes = viewMode === 'balance'
    ? ['assets', 'liabilities', 'equity']
    : ['revenue', 'expenses'];

  return (
    <Stack gap="md">
      <Group justify="space-between" wrap="wrap">
        <Switch
          label="停止中科目を表示"
          checked={showInactiveAccounts}
          onChange={(e) => handleToggleInactiveAccounts(e.currentTarget.checked)}
          size="sm"
        />
        <Group gap="sm">
          <SegmentedControl
            value={viewMode}
            onChange={(value) => setViewMode(value as 'balance' | 'income')}
            data={[
              { label: '貸借対照表', value: 'balance' },
              { label: '損益計算書', value: 'income' },
            ]}
            size="sm"
          />
          <Button leftSection={<IconPlus size={16} />} onClick={open}>
            追加する
          </Button>
        </Group>
      </Group>


      <Paper shadow="xs" p="md" radius="md">
        {Object.entries(accounts)
          .filter(([type]) => filteredAccountTypes.includes(type))
          .map(([type, accountList]) => (
          <Box key={type} mb="md">
            <Title order={5} mb="xs">{ACCOUNT_TYPE_LABELS[type as keyof typeof ACCOUNT_TYPE_LABELS] || type}</Title>
            <Stack gap={4}>
              {accountList.length === 0 ? (
                <Box p="md" style={{
                  backgroundColor: surfaceBg,
                  borderRadius: '6px',
                  border: surfaceBorder,
                  textAlign: 'center',
                  color: surfaceTextMuted
                }}>
                  勘定科目がありません
                </Box>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => handleDragEnd(e, type)}
                >
                  <SortableContext
                    items={[...(accountOrder[type] || accountList.map((a: any) => a.id))].map(String)}
                    strategy={verticalListSortingStrategy}
                  >
                    {[...accountList]
                      .sort((a: any, b: any) => {
                        const order = accountOrder[type] || [];
                        return order.indexOf(a.id) - order.indexOf(b.id);
                      })
                      .map((account: any) => (
                      <SortableRow key={String(account.id)} id={String(account.id)}>
                        {(dragHandle) => (
                          <Box>
                            {/* 勘定科目 */}
                            <Group justify="space-between" p="xs" style={{
                              backgroundColor: account.is_active === false
                                ? (colorScheme === 'dark' ? 'rgba(255,255,255,0.03)' : '#f5f5f5')
                                : surfaceBg,
                              borderRadius: '6px',
                              border: account.is_active === false
                                ? (colorScheme === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e0e0e0')
                                : surfaceBorder,
                              opacity: account.is_active === false ? 0.7 : 1,
                            }}>
                              {inlineEditingId === account.id ? (
                                // インライン編集モード
                                <Group gap="xs" style={{ flex: 1 }}>
                                  <TextInput
                                    value={inlineEditValue}
                                    onChange={(e) => setInlineEditValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveInlineEdit();
                                      if (e.key === 'Escape') cancelInlineEdit();
                                    }}
                                    autoFocus
                                    size="sm"
                                    style={{ flex: 1 }}
                                    disabled={isSubmitting}
                                  />
                                  <ActionIcon
                                    size="sm"
                                    variant="subtle"
                                    color="green"
                                    onClick={saveInlineEdit}
                                    loading={isSubmitting}
                                  >
                                    <IconCheck size={16} />
                                  </ActionIcon>
                                  <ActionIcon
                                    size="sm"
                                    variant="subtle"
                                    color="gray"
                                    onClick={cancelInlineEdit}
                                    disabled={isSubmitting}
                                  >
                                    <IconX size={16} />
                                  </ActionIcon>
                                </Group>
                              ) : (
                                // 表示モード（クリックで編集開始）
                                <>
                                  {account.is_active !== false && dragHandle}
                                  <span
                                    style={{
                                      flex: 1,
                                      fontWeight: 500,
                                      cursor: account.is_active === false ? 'default' : 'pointer',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      transition: 'background-color 0.15s',
                                      color: account.is_active === false ? surfaceTextMuted : undefined,
                                    }}
                                    onClick={() => account.is_active !== false && startInlineEdit(account)}
                                    onMouseEnter={(e) => {
                                      if (account.is_active === false) return;
                                      e.currentTarget.style.backgroundColor = colorScheme === 'dark'
                                        ? 'rgba(255,255,255,0.1)'
                                        : 'rgba(0,0,0,0.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                    title={account.is_active === false ? undefined : 'クリックして編集'}
                                  >
                                    {account.name}
                                  </span>
                                  {account.is_active === false && (
                                    <Badge color="gray" variant="light" size="sm">停止中</Badge>
                                  )}
                                </>
                              )}
                              <Group gap="xs">
                                {account.is_active === false ? (
                                  // 停止中アカウント：使用再開ボタン
                                  <Button
                                    size="xs"
                                    variant="light"
                                    color="blue"
                                    onClick={() => handleReactivateAccount(account.id)}
                                  >
                                    使用再開
                                  </Button>
                                ) : (
                                  <>
                                    {isPro && (
                                      <ActionIcon
                                        size="sm"
                                        variant="subtle"
                                        onClick={() => openSubaccountManager(account)}
                                        title="補助科目を管理"
                                      >
                                        <IconPlus size={16} />
                                      </ActionIcon>
                                    )}
                                    {account.is_system ? (
                                      <ActionIcon
                                        size="sm"
                                        variant="subtle"
                                        color="gray"
                                        disabled
                                        title="システム勘定科目は削除できません"
                                      >
                                        <IconLock size={16} />
                                      </ActionIcon>
                                    ) : (
                                      <ActionIcon
                                        size="sm"
                                        variant="subtle"
                                        color="red"
                                        onClick={() => handleDeleteAccount(account.id, account.name)}
                                        title="削除"
                                      >
                                        <IconTrash size={16} />
                                      </ActionIcon>
                                    )}
                                  </>
                                )}
                              </Group>
                            </Group>

                            {/* 補助科目をインデント表示（Pro版のみ） */}
                            {isPro && subaccountsCache[account.id] && subaccountsCache[account.id].length > 0 && (
                              <Stack gap={4} ml="xl" mt={4}>
                                {subaccountsCache[account.id].map((sub) => (
                                  <Group
                                    key={sub.id}
                                    justify="space-between"
                                    p="xs"
                                    style={{
                                      backgroundColor: subaccountBg,
                                      borderRadius: '4px',
                                      border: surfaceBorder,
                                      marginLeft: '8px',
                                    }}
                                  >
                                    <Text size="sm" c="dimmed" style={{ paddingLeft: '8px' }}>
                                      └ {sub.name}
                                    </Text>
                                  </Group>
                                ))}
                              </Stack>
                            )}
                            {isPro && loadingSubaccounts[account.id] && (
                              <Box ml="xl" mt={4} pl="md">
                                <Loader size="xs" />
                              </Box>
                            )}
                          </Box>
                        )}
                      </SortableRow>
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </Stack>
          </Box>
        ))}
      </Paper>

      {/* 追加モーダル */}
      <Modal
        opened={opened}
        onClose={handleCloseModal}
        title="勘定科目の追加"
        size="lg"
        centered
        zIndex={2000}
        overlayProps={{ opacity: 0.55, blur: 3 }}
      >
        <Stack p="md" gap="md">
          <Select
            label="勘定科目の種類を選択"
            placeholder="資産・負債・純資産・収益・費用から選択してください"
            data={Object.entries(ACCOUNT_TYPES).map(([, value]) => ({ value, label: value }))}
            value={selectedType}
            onChange={setSelectedType}
            required
            disabled={isSubmitting}
            styles={{
              dropdown: {
                zIndex: 2001,
              },
              label: {
                pointerEvents: 'none',
              }
            }}
          />
          <TextInput
            label="勘定科目名の入力"
            placeholder="科目名を入力してください"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            required
            disabled={isSubmitting}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={handleCloseModal} disabled={isSubmitting}>
              キャンセル
            </Button>
            <Button
              onClick={handleAddAccount}
              loading={isSubmitting}
            >
              追加
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* 使用停止確認モーダル */}
      <Modal
        opened={deactivateTargetAccount !== null}
        onClose={() => setDeactivateTargetAccount(null)}
        title="使用停止の確認"
        centered
        zIndex={2000}
      >
        <Stack gap="md">
          <Text size="sm">
            「{deactivateTargetAccount?.name}」は仕訳帳に使用されているため削除できません。
          </Text>
          <Text size="sm">
            代わりに<strong>使用停止</strong>にしますか？使用停止にすると新しい仕訳では選択できなくなりますが、過去の仕訳・レポートには引き続き表示されます。
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button
              variant="outline"
              onClick={() => setDeactivateTargetAccount(null)}
              disabled={deactivating}
            >
              キャンセル
            </Button>
            <Button
              color="orange"
              loading={deactivating}
              onClick={handleDeactivateAccount}
            >
              使用停止にする
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* 補助科目管理モーダル */}
      <Modal
        opened={subModalOpen}
        onClose={() => setSubModalOpen(false)}
        title={subTargetAccount ? `${subTargetAccount.name} の補助科目` : '補助科目'}
        size="lg"
        centered
      >
        <Stack gap="md">
          <Group align="flex-end">
            <TextInput
              label="補助科目名"
              placeholder="補助科目名を入力"
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
            />
            <Button
              loading={subSubmitting}
              onClick={async () => {
                if (!subTargetAccount || !subName.trim()) return;
                setSubSubmitting(true);
                try {
                  if (subEditingId) {
                    const updated = await updateSubaccount(subEditingId, { name: subName });
                    setSubList(prev => prev.map(s => s.id === updated.id ? { id: updated.id, name: updated.name } : s));
                    // キャッシュも更新
                    setSubaccountsCache(prev => ({
                      ...prev,
                      [subTargetAccount.id]: prev[subTargetAccount.id]?.map(s =>
                        s.id === updated.id ? { id: updated.id, name: updated.name } : s
                      ) || []
                    }));
                    setSubEditingId(null);
                  } else {
                    const created = await createSubaccount(subTargetAccount.id, subName);
                    setSubList(prev => [...prev, { id: created.id, name: created.name }]);
                    // キャッシュも更新
                    setSubaccountsCache(prev => ({
                      ...prev,
                      [subTargetAccount.id]: [...(prev[subTargetAccount.id] || []), { id: created.id, name: created.name }]
                    }));
                  }
                  setSubName('');
                } finally {
                  setSubSubmitting(false);
                }
              }}
            >
              {subEditingId ? '保存' : '追加'}
            </Button>
          </Group>
          <Stack gap="xs">
            {subList.map((item) => (
              <Group key={item.id} justify="space-between" p="xs" style={{ backgroundColor: surfaceBg, borderRadius: '6px', border: surfaceBorder }}>
                <span>{item.name}</span>
                <Group gap="xs">
                  <ActionIcon size="sm" variant="subtle" onClick={() => { setSubEditingId(item.id); setSubName(item.name); }}>
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon size="sm" variant="subtle" color="red" onClick={async () => {
                    if (!confirm('この補助科目を削除しますか？')) return;
                    await deleteSubaccount(item.id);
                    setSubList(prev => prev.filter(s => s.id !== item.id));
                    // キャッシュも更新
                    if (subTargetAccount) {
                      setSubaccountsCache(prev => ({
                        ...prev,
                        [subTargetAccount.id]: prev[subTargetAccount.id]?.filter(s => s.id !== item.id) || []
                      }));
                    }
                  }}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Group>
            ))}
          </Stack>
        </Stack>
      </Modal>
    </Stack>
  );
}
