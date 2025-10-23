import { useState } from 'react';
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
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconDots,
  IconAlertCircle,
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
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '6px',
                  border: '1px solid #e9ecef',
                  textAlign: 'center',
                  color: '#6c757d'
                }}>
                  勘定科目がありません
                </Box>
              ) : (
                accountList.map((account: any) => (
                  <Group key={account.id} justify="space-between" p="xs" style={{ 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '6px',
                    border: '1px solid #e9ecef'
                  }}>
                    <span style={{ fontWeight: 500 }}>{account.name}</span>
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
                          編集
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
        styles={{
          content: {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2000,
          }
        }}
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
                    setSubEditingId(null);
                  } else {
                    const created = await createSubaccount(subTargetAccount.id, subName);
                    setSubList(prev => [...prev, { id: created.id, name: created.name }]);
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
              <Group key={item.id} justify="space-between" p="xs" style={{ backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                <span>{item.name}</span>
                <Group gap="xs">
                  <ActionIcon size="sm" variant="subtle" onClick={() => { setSubEditingId(item.id); setSubName(item.name); }}>
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon size="sm" variant="subtle" color="red" onClick={async () => {
                    if (!confirm('この補助科目を削除しますか？')) return;
                    await deleteSubaccount(item.id);
                    setSubList(prev => prev.filter(s => s.id !== item.id));
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