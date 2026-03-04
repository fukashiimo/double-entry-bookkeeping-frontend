import { useState, useEffect, useCallback } from 'react';
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
  Menu,
  Alert,
  Loader,
  Center,
  Text,
  useMantineTheme,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconDots,
  IconAlertCircle,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { useAccounts } from '../hooks/useAccounts';
import { useSubaccounts } from '../hooks/useSubaccounts';

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

export default function AccountSettings() {
  const { accounts, loading, error, createAccount, updateAccount, deleteAccount } = useAccounts();
  const { fetchSubaccounts, createSubaccount, updateSubaccount, deleteSubaccount } = useSubaccounts();
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [accountName, setAccountName] = useState('');
  const [editingAccount, setEditingAccount] = useState<{ id: number; name: string; type: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // 補助科目のキャッシュ（勘定科目ID → 補助科目リスト）
  const [subaccountsCache, setSubaccountsCache] = useState<Record<number, { id: number; name: string }[]>>({});
  const [loadingSubaccounts, setLoadingSubaccounts] = useState<Record<number, boolean>>({});

  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const surfaceBg = colorScheme === 'dark' ? theme.colors.dark[6] : '#f8f9fa';
  const surfaceBorder = colorScheme === 'dark' ? '1px solid rgba(255,255,255,0.15)' : '1px solid #e9ecef';
  const surfaceTextMuted = colorScheme === 'dark' ? theme.colors.gray[6] : '#6c757d';
  const subaccountBg = colorScheme === 'dark' ? theme.colors.dark[7] : '#fff';
  
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

  const handleEditAccount = (account: { id: number; name: string; type: string }) => {
    setSelectedType(account.type);
    setAccountName(account.name);
    setEditingAccount(account);
    open();
  };

  const handleSaveEdit = async () => {
    if (!editingAccount || !accountName.trim()) return;

    try {
      setIsSubmitting(true);
      await updateAccount(editingAccount.id, accountName, selectedType as any);
      setEditingAccount(null);
      setAccountName('');
      close();
    } catch (err) {
      console.error('Error updating account:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async (id: number) => {
    if (!confirm('この勘定科目を削除しますか？')) return;

    try {
      await deleteAccount(id);
    } catch (err) {
      console.error('Error deleting account:', err);
    }
  };

  const handleCloseModal = () => {
    close();
    setEditingAccount(null);
    setSelectedType(null);
    setAccountName('');
  };

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
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

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>勘定科目設定</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          追加する
        </Button>
      </Group>

      <Paper shadow="xs" p="md" radius="md">
        {Object.entries(accounts).map(([type, accountList]) => (
          <Box key={type} mb="lg">
            <Title order={4} mb="sm">{ACCOUNT_TYPE_LABELS[type as keyof typeof ACCOUNT_TYPE_LABELS] || type}</Title>
            <Stack gap="xs">
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
                accountList.map((account: any) => (
                  <Box key={account.id}>
                    {/* 勘定科目 */}
                    <Group justify="space-between" p="xs" style={{
                      backgroundColor: surfaceBg,
                      borderRadius: '6px',
                      border: surfaceBorder
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
                        <span
                          style={{
                            fontWeight: 500,
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            transition: 'background-color 0.15s',
                          }}
                          onClick={() => startInlineEdit(account)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = colorScheme === 'dark'
                              ? 'rgba(255,255,255,0.1)'
                              : 'rgba(0,0,0,0.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          title="クリックして編集"
                        >
                          {account.name}
                        </span>
                      )}
                      <Menu position="bottom-start">
                        <Menu.Target>
                          <ActionIcon size="sm" variant="subtle">
                            <IconDots size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconEdit size={16} />}
                            onClick={() => handleEditAccount(account)}
                          >
                            編集（モーダル）
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconPlus size={16} />}
                            onClick={async () => {
                              setSubTargetAccount({ id: account.id, name: account.name });
                              setSubModalOpen(true);
                              setSubEditingId(null);
                              setSubName('');
                              try {
                                const list = await fetchSubaccounts(account.id);
                                setSubList(list.map(s => ({ id: s.id, name: s.name })));
                              } catch (e) {
                                setSubList([]);
                              }
                            }}
                          >
                            補助科目を管理
                          </Menu.Item>
                          <Menu.Item leftSection={<IconTrash size={16} />} color="red" onClick={() => handleDeleteAccount(account.id)}>
                            削除
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>

                    {/* 補助科目をインデント表示 */}
                    {subaccountsCache[account.id] && subaccountsCache[account.id].length > 0 && (
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
                    {loadingSubaccounts[account.id] && (
                      <Box ml="xl" mt={4} pl="md">
                        <Loader size="xs" />
                      </Box>
                    )}
                  </Box>
                ))
              )}
            </Stack>
          </Box>
        ))}
      </Paper>

      {/* 追加・編集モーダル */}
      <Modal
        opened={opened}
        onClose={handleCloseModal}
        title={editingAccount ? "勘定科目の編集" : "勘定科目の追加"}
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
              onClick={editingAccount ? handleSaveEdit : handleAddAccount}
              loading={isSubmitting}
            >
              {editingAccount ? "保存" : "追加"}
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