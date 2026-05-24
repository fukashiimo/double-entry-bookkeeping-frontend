import { useState } from 'react';
import {
  Box, Paper, Stack, Text, Group, useComputedColorScheme,
  Button, Modal, TextInput, Alert, Divider, Badge,
} from '@mantine/core';
import { useMantineColorScheme } from '@mantine/core';
import { IconSun, IconMoon, IconAlertTriangle, IconLogout, IconRefresh } from '@tabler/icons-react';
import { useTheme, type PrimaryColor } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { notifications } from '@mantine/notifications';

const supabaseUrl = 'https://iivyylojvqgucmbyfrqw.supabase.co';

const colorOptions: Array<{ value: PrimaryColor; label: string; color: string }> = [
  { value: 'orange', label: 'オレンジ', color: '#FFB31E' },
  { value: 'pastelPink', label: 'パステルピンク', color: '#FFB6C1' },
  { value: 'pastelBlue', label: 'パステルブルー', color: '#AED9E0' },
  { value: 'pastelGreen', label: 'パステルグリーン', color: '#B4E4B4' },
  { value: 'pastelYellow', label: 'パステルイエロー', color: '#FFFACD' },
  { value: 'pastelPurple', label: 'パステルパープル', color: '#E6E6FA' },
];

const SectionCard = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
  <Paper p="xl" radius="md" withBorder>
    <Stack gap="md">
      <Box>
        <Text size="lg" fw={600} mb={description ? 4 : 0}>{title}</Text>
        {description && <Text size="sm" c="dimmed">{description}</Text>}
      </Box>
      <Divider />
      {children}
    </Stack>
  </Paper>
);

const Settings = () => {
  const { primaryColor, setPrimaryColor } = useTheme();
  const colorScheme = useComputedColorScheme('light');
  const { setColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const { user, signOut } = useAuth();

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    if (resetConfirmText !== 'リセット') return;
    setResetting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('Unauthorized');

      const response = await fetch(`${supabaseUrl}/functions/v1/reset-user-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      setResetModalOpen(false);
      setResetConfirmText('');
      notifications.show({
        title: 'リセット完了',
        message: 'データを初期状態に戻しました。ページを再読み込みします。',
        color: 'green',
        autoClose: 3000,
      });
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      notifications.show({
        title: 'リセット失敗',
        message: err instanceof Error ? err.message : 'エラーが発生しました',
        color: 'red',
      });
    } finally {
      setResetting(false);
    }
  };

  return (
    <Stack gap="xl" style={{ maxWidth: 720 }}>

      {/* 1. カラー設定 */}
      <SectionCard
        title="カラー設定"
        description="アプリ全体のテーマカラーを変更できます。サイドバー、ボタン、選択状態などに反映されます。"
      >
        <Group gap="sm" wrap="wrap">
          {colorOptions.map((option) => (
            <Box
              key={option.value}
              onClick={() => setPrimaryColor(option.value)}
              style={{
                cursor: 'pointer',
                padding: '10px 16px',
                borderRadius: '8px',
                border: `2px solid ${primaryColor === option.value ? option.color : isDark ? '#373A40' : '#dee2e6'}`,
                backgroundColor: primaryColor === option.value
                  ? `${option.color}${isDark ? '28' : '18'}`
                  : isDark ? '#25262b' : '#f8f9fa',
                transition: 'all 0.2s ease',
                flex: '1 1 auto',
                minWidth: '110px',
              }}
            >
              <Group gap="xs" justify="center">
                <Box style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: option.color, border: '2px solid rgba(0,0,0,0.1)' }} />
                <Text size="sm" fw={primaryColor === option.value ? 600 : 400}>{option.label}</Text>
              </Group>
            </Box>
          ))}
        </Group>
      </SectionCard>

      {/* 2. 表示設定 */}
      <SectionCard
        title="表示設定"
        description="帳票や一覧画面の表示方法を設定できます。"
      >
        <Group justify="space-between" align="center">
          <Box>
            <Text size="sm" fw={500}>ダークモード</Text>
            <Text size="xs" c="dimmed">画面全体を暗い配色に切り替えます</Text>
          </Box>
          <Button
            variant="light"
            size="sm"
            leftSection={isDark ? <IconSun size={16} /> : <IconMoon size={16} />}
            onClick={() => setColorScheme(isDark ? 'light' : 'dark')}
          >
            {isDark ? 'ライトモードに切替' : 'ダークモードに切替'}
          </Button>
        </Group>
        <Divider />
        <Box>
          <Text size="sm" c="dimmed">
            「0円科目の非表示」「補助科目の全表示」はダッシュボード画面で個別に切り替えられます。
          </Text>
        </Box>
      </SectionCard>

      {/* 3. データ管理 */}
      <SectionCard
        title="データ管理"
        description="検証時や初期状態に戻したい場合のみ使用してください。"
      >
        <Alert icon={<IconAlertTriangle size={16} />} color="red" variant="light">
          データのリセットは元に戻せません。検証時や初期状態に戻したい場合のみ使用してください。
        </Alert>
        <Group justify="space-between" align="center">
          <Box>
            <Text size="sm" fw={500}>すべてのデータをリセット</Text>
            <Text size="xs" c="dimmed">仕訳・勘定科目をすべて削除し、デフォルト勘定科目を再作成します</Text>
          </Box>
          <Button
            color="red"
            variant="outline"
            leftSection={<IconRefresh size={16} />}
            onClick={() => { setResetModalOpen(true); setResetConfirmText(''); }}
          >
            リセット
          </Button>
        </Group>
      </SectionCard>

      {/* 4. アカウント設定 */}
      <SectionCard title="アカウント設定">
        <Group justify="space-between" align="center">
          <Box>
            <Text size="xs" c="dimmed">ログイン中</Text>
            <Text size="sm" fw={500}>{user?.email}</Text>
          </Box>
          <Badge color="green" variant="light">ログイン中</Badge>
        </Group>
        <Divider />
        <Group justify="flex-end">
          <Button
            color="red"
            variant="light"
            leftSection={<IconLogout size={16} />}
            onClick={async () => {
              await signOut();
              window.location.href = `${window.location.origin}/double-entry-bookkeeping-frontend/login`;
            }}
          >
            ログアウト
          </Button>
        </Group>
      </SectionCard>

      {/* リセット確認モーダル */}
      <Modal
        opened={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="すべてのデータをリセット"
        centered
      >
        <Stack gap="md">
          <Alert icon={<IconAlertTriangle size={16} />} color="red">
            <Text size="sm" fw={600}>この操作は元に戻せません。</Text>
            <Text size="sm" mt={4}>
              登録済みの仕訳・勘定科目がすべて削除されます。
              デフォルト勘定科目のみ再作成されます。
            </Text>
          </Alert>
          <TextInput
            label='確認のため「リセット」と入力してください'
            placeholder="リセット"
            value={resetConfirmText}
            onChange={(e) => setResetConfirmText(e.currentTarget.value)}
          />
          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={() => setResetModalOpen(false)}>キャンセル</Button>
            <Button
              color="red"
              disabled={resetConfirmText !== 'リセット'}
              loading={resetting}
              onClick={handleReset}
            >
              リセットする
            </Button>
          </Group>
        </Stack>
      </Modal>

    </Stack>
  );
};

export default Settings;
