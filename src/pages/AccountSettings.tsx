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
  Collapse,
  Badge,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconDots,
  IconChevronDown,
  IconChevronRight,
  IconSubtask,
} from '@tabler/icons-react';

// 勘定科目の種類の定義
const ACCOUNT_TYPES = {
  ASSETS: '資産',
  LIABILITIES: '負債',
  EQUITY: '純資産',
  REVENUE: '収益',
  EXPENSES: '費用',
} as const;

// 補助科目の型定義
interface SubAccount {
  id: number;
  name: string;
}

// 勘定科目の型定義
interface Account {
  id: number;
  name: string;
  subAccounts?: SubAccount[];
}

// サンプルデータ
const initialAccounts = {
  [ACCOUNT_TYPES.ASSETS]: [
    { 
      id: 1, 
      name: '現金',
      subAccounts: [
        { id: 101, name: '現金（本店）' },
        { id: 102, name: '現金（支店）' },
      ]
    },
    { 
      id: 2, 
      name: '普通預金',
      subAccounts: [
        { id: 201, name: '普通預金（A銀行）' },
        { id: 202, name: '普通預金（B銀行）' },
      ]
    },
    { id: 3, name: '有価証券' },
    { id: 4, name: '建物' },
    { id: 5, name: '車両' },
  ],
  [ACCOUNT_TYPES.LIABILITIES]: [
    { 
      id: 6, 
      name: '借入金',
      subAccounts: [
        { id: 601, name: '短期借入金' },
        { id: 602, name: '長期借入金' },
      ]
    },
  ],
  [ACCOUNT_TYPES.EQUITY]: [
    { id: 7, name: '利益金' },
  ],
  [ACCOUNT_TYPES.REVENUE]: [
    { id: 8, name: '給与' },
    { id: 9, name: '雑収入' },
  ],
  [ACCOUNT_TYPES.EXPENSES]: [
    { 
      id: 10, 
      name: '会費',
      subAccounts: [
        { id: 1001, name: '年会費' },
        { id: 1002, name: '月会費' },
      ]
    },
    { id: 11, name: '水道光熱費' },
    { id: 12, name: '家賃' },
  ],
};

export default function AccountSettings() {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [opened, { open, close }] = useDisclosure(false);
  const [subAccountOpened, { open: openSubAccount, close: closeSubAccount }] = useDisclosure(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [accountName, setAccountName] = useState('');
  const [subAccountName, setSubAccountName] = useState('');
  const [editingAccount, setEditingAccount] = useState<{ type: string; id: number } | null>(null);
  const [editingSubAccount, setEditingSubAccount] = useState<{ type: string; accountId: number; subAccountId: number } | null>(null);
  const [selectedAccountForSubAccount, setSelectedAccountForSubAccount] = useState<{ type: string; accountId: number } | null>(null);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());

  const handleAddAccount = () => {
    if (!selectedType || !accountName.trim()) return;

    const newAccount = {
      id: Math.max(...Object.values(accounts).flat().map(a => a.id)) + 1,
      name: accountName,
    };

    setAccounts(prev => ({
      ...prev,
      [selectedType]: [...(prev[selectedType as keyof typeof prev] || []), newAccount],
    }));

    setSelectedType(null);
    setAccountName('');
    close();
  };

  const handleEditAccount = (type: string, account: { id: number; name: string }) => {
    setSelectedType(type);
    setAccountName(account.name);
    setEditingAccount({ type, id: account.id });
    open();
  };

  const handleSaveEdit = () => {
    if (!editingAccount || !accountName.trim()) return;

    setAccounts(prev => ({
      ...prev,
      [editingAccount.type]: (prev[editingAccount.type as keyof typeof prev] || []).map((account: { id: number; name: string }) =>
        account.id === editingAccount.id ? { ...account, name: accountName } : account
      ),
    }));

    setEditingAccount(null);
    setAccountName('');
    close();
  };

  const handleDeleteAccount = (type: string, accountId: number) => {
    setAccounts(prev => ({
      ...prev,
      [type]: (prev[type as keyof typeof prev] || []).filter((account: Account) => account.id !== accountId),
    }));
  };

  // 補助科目関連の関数
  const handleAddSubAccount = (type: string, accountId: number) => {
    setSelectedAccountForSubAccount({ type, accountId });
    setSubAccountName('');
    setEditingSubAccount(null);
    openSubAccount();
  };

  const handleEditSubAccount = (type: string, accountId: number, subAccount: SubAccount) => {
    setSelectedAccountForSubAccount({ type, accountId });
    setSubAccountName(subAccount.name);
    setEditingSubAccount({ type, accountId, subAccountId: subAccount.id });
    openSubAccount();
  };

  const handleSaveSubAccount = () => {
    if (!selectedAccountForSubAccount || !subAccountName.trim()) return;

    setAccounts(prev => ({
      ...prev,
      [selectedAccountForSubAccount.type]: (prev[selectedAccountForSubAccount.type as keyof typeof prev] || []).map((account: Account) => {
        if (account.id === selectedAccountForSubAccount.accountId) {
          const subAccounts = account.subAccounts || [];
          if (editingSubAccount) {
            // 編集
            return {
              ...account,
              subAccounts: subAccounts.map(sub => 
                sub.id === editingSubAccount.subAccountId 
                  ? { ...sub, name: subAccountName }
                  : sub
              )
            };
          } else {
            // 追加
            const newSubAccount = {
              id: Math.max(...subAccounts.map(s => s.id), 0) + 1,
              name: subAccountName,
            };
            return {
              ...account,
              subAccounts: [...subAccounts, newSubAccount]
            };
          }
        }
        return account;
      })
    }));

    setSelectedAccountForSubAccount(null);
    setSubAccountName('');
    setEditingSubAccount(null);
    closeSubAccount();
  };

  const handleDeleteSubAccount = (type: string, accountId: number, subAccountId: number) => {
    setAccounts(prev => ({
      ...prev,
      [type]: (prev[type as keyof typeof prev] || []).map((account: Account) => {
        if (account.id === accountId) {
          return {
            ...account,
            subAccounts: (account.subAccounts || []).filter(sub => sub.id !== subAccountId)
          };
        }
        return account;
      })
    }));
  };

  const toggleAccountExpansion = (accountKey: string) => {
    setExpandedAccounts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accountKey)) {
        newSet.delete(accountKey);
      } else {
        newSet.add(accountKey);
      }
      return newSet;
    });
  };

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
            <Title order={4} mb="sm">{type}</Title>
            <Stack gap="xs">
              {accountList.map((account: Account) => {
                const accountKey = `${type}-${account.id}`;
                const isExpanded = expandedAccounts.has(accountKey);
                const hasSubAccounts = account.subAccounts && account.subAccounts.length > 0;
                
                return (
                  <Box key={account.id}>
                    <Group justify="space-between" p="xs" style={{ 
                      backgroundColor: '#f8f9fa', 
                      borderRadius: '6px',
                      border: '1px solid #e9ecef'
                    }}>
                      <Group gap="xs">
                        {hasSubAccounts && (
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            onClick={() => toggleAccountExpansion(accountKey)}
                          >
                            {isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
                          </ActionIcon>
                        )}
                        <span style={{ fontWeight: 500 }}>{account.name}</span>
                        {hasSubAccounts && (
                          <Badge size="sm" variant="light" color="blue">
                            {account.subAccounts?.length}個の補助科目
                          </Badge>
                        )}
                      </Group>
                      <Group gap="xs">
                        {hasSubAccounts && (
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="blue"
                            onClick={() => handleAddSubAccount(type, account.id)}
                            title="補助科目を追加"
                          >
                            <IconSubtask size={16} />
                          </ActionIcon>
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
                              onClick={() => handleEditAccount(type, account)}
                            >
                              編集
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconSubtask size={16} />}
                              onClick={() => handleAddSubAccount(type, account.id)}
                            >
                              補助科目を追加
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconTrash size={16} />}
                              color="red"
                              onClick={() => handleDeleteAccount(type, account.id)}
                            >
                              削除
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Group>
                    
                    {hasSubAccounts && (
                      <Collapse in={isExpanded}>
                        <Box ml="md" mt="xs">
                          <Stack gap="xs">
                            {account.subAccounts?.map((subAccount: SubAccount) => (
                              <Group key={subAccount.id} justify="space-between" p="xs" style={{
                                backgroundColor: '#ffffff',
                                borderRadius: '4px',
                                border: '1px solid #e9ecef',
                                marginLeft: '20px'
                              }}>
                                <Group gap="xs">
                                  <IconSubtask size={14} color="#6c757d" />
                                  <span style={{ fontSize: '14px' }}>{subAccount.name}</span>
                                </Group>
                                <Menu position="bottom-start">
                                  <Menu.Target>
                                    <ActionIcon size="sm" variant="subtle">
                                      <IconDots size={14} />
                                    </ActionIcon>
                                  </Menu.Target>
                                  <Menu.Dropdown>
                                    <Menu.Item
                                      leftSection={<IconEdit size={14} />}
                                      onClick={() => handleEditSubAccount(type, account.id, subAccount)}
                                    >
                                      編集
                                    </Menu.Item>
                                    <Menu.Item
                                      leftSection={<IconTrash size={14} />}
                                      color="red"
                                      onClick={() => handleDeleteSubAccount(type, account.id, subAccount.id)}
                                    >
                                      削除
                                    </Menu.Item>
                                  </Menu.Dropdown>
                                </Menu>
                              </Group>
                            ))}
                          </Stack>
                        </Box>
                      </Collapse>
                    )}
                  </Box>
                );
              })}
            </Stack>
          </Box>
        ))}
      </Paper>

      {/* 追加・編集モーダル */}
      <Modal
        opened={opened}
        onClose={() => {
          close();
          setEditingAccount(null);
          setSelectedType(null);
          setAccountName('');
        }}
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
          />
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={close}>キャンセル</Button>
            <Button onClick={editingAccount ? handleSaveEdit : handleAddAccount}>
              {editingAccount ? "保存" : "追加"}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* 補助科目追加・編集モーダル */}
      <Modal
        opened={subAccountOpened}
        onClose={() => {
          closeSubAccount();
          setEditingSubAccount(null);
          setSelectedAccountForSubAccount(null);
          setSubAccountName('');
        }}
        title={editingSubAccount ? "補助科目の編集" : "補助科目の追加"}
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
        <Stack gap="md">
          <TextInput
            label="補助科目名の入力"
            placeholder="補助科目名を入力してください"
            value={subAccountName}
            onChange={(e) => setSubAccountName(e.target.value)}
            required
          />
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeSubAccount}>キャンセル</Button>
            <Button onClick={handleSaveSubAccount}>
              {editingSubAccount ? "保存" : "追加"}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

