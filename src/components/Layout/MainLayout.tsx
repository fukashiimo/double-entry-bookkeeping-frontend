import { useEffect } from 'react';

/** 16進カラーの輝度が明るい（>0.55）かを判定 */
function isLightColor(hex: string): boolean {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
}
import { useNavigate, useLocation } from 'react-router-dom';
import { AppShell, Burger, Group, Title, UnstyledButton, Text, Box, Stack, ActionIcon, Affix, Menu, Avatar } from '@mantine/core';
import { useMantineColorScheme, useMantineTheme, useComputedColorScheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconBook,
  IconSettings,
  IconChartPie,
  IconPlus,
  IconList,
  IconUser,
  IconSun,
  IconMoon,
  IconCalendarStats,
} from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';

const mainLinks = [
  { icon: IconChartPie, label: 'ダッシュボード', path: '/reports' },
  { icon: IconBook, label: '仕訳帳', path: '/journal-list' },
  { icon: IconPlus, label: '仕訳入力', path: '/journal-entry' },
  { icon: IconCalendarStats, label: 'カレンダー', path: '/calendar' },
  { icon: IconList, label: '勘定科目設定', path: '/account-settings' },
  { icon: IconSettings, label: '設定', path: '/settings' },
  { icon: IconUser, label: 'マイページ', path: '/mypage' },
];

const HEADER_HEIGHT = 52;

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { setColorScheme } = useMantineColorScheme();
  const colorScheme = useComputedColorScheme('light');
  const theme = useMantineTheme();
  const isDark = colorScheme === 'dark';

  const toggleColorScheme = () => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');

  // ページ遷移時にスクロール位置をリセット
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // プライマリカラーの取得（テーマカラーに連動したサイドバー）
  const primaryColor = theme.primaryColor || 'orange';
  const primaryShade = theme.colors[primaryColor];
  // ライトモード: 淡いテーマカラー背景 / ダークモード: 濃いテーマカラー背景
  const sidebarBg    = isDark ? primaryShade[9] : primaryShade[1];
  const headerBg     = isDark ? primaryShade[9] : primaryShade[2];
  const textColor      = isDark ? 'rgba(255,255,255,0.90)' : '#1f2328';
  const activeItemBg    = isDark ? primaryShade[7] : primaryShade[6];
  // 明るいテーマ（パステルイエロー等）では白文字が視認しにくいため輝度で切り替え
  const activeTextColor = (!isDark && isLightColor(primaryShade[6])) ? '#2c1a00' : '#ffffff';
  const hoverItemBg   = isDark ? 'rgba(255,255,255,0.08)' : primaryShade[2];

  const mainItems = mainLinks.map((link) => {
    const isActive = location.pathname === link.path;

    return (
      <UnstyledButton
        key={link.label}
        onClick={() => {
          navigate(link.path);
          if (opened) toggle();
        }}
        px="md"
        py="sm"
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          borderRadius: theme.radius.md,
          color: isActive ? activeTextColor : textColor,
          backgroundColor: isActive ? activeItemBg : 'transparent',
          transition: 'all 0.15s ease',
          fontWeight: isActive ? 600 : 400,
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.backgroundColor = hoverItemBg;
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
          }
        }}
      >
        <Box style={{ display: 'flex', alignItems: 'center' }}>
          <link.icon size={20} stroke={1.5} />
          <Text ml="sm" size="sm" fw={isActive ? 600 : 400} style={{ color: 'inherit' }}>
            {link.label}
          </Text>
        </Box>
      </UnstyledButton>
    );
  });

  return (
    <AppShell
      header={{ height: HEADER_HEIGHT }}
      navbar={{
        width: 240,
        breakpoint: 'sm',
        collapsed: { mobile: !opened, desktop: false },
      }}
      padding="xl"
      style={{ minHeight: '100vh' }}
    >
      {/* スリムなトップバー */}
      <AppShell.Header
        style={{
          backgroundColor: headerBg,
          borderBottom: isDark ? 'none' : '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <Group h="100%" px="md" justify="space-between">
          <Group gap="xs">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
              color={isDark ? 'rgba(255,255,255,0.8)' : primaryShade[7]}
            />
          </Group>

          <Group gap="xs">
            <ActionIcon
              variant="subtle"
              size="md"
              radius="xl"
              onClick={toggleColorScheme}
              aria-label="Toggle color scheme"
              style={{ color: isDark ? 'rgba(255,255,255,0.75)' : primaryShade[7] }}
            >
              {colorScheme === 'dark' ? <IconSun size={17} /> : <IconMoon size={17} />}
            </ActionIcon>

            <Menu shadow="md" width={200}>
              <Menu.Target>
                <ActionIcon variant="subtle" size="md" radius="xl">
                  <Avatar size={26} radius="xl" color={primaryColor} variant="filled">
                    {user?.email?.charAt(0).toUpperCase() || <IconUser size={14} />}
                  </Avatar>
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown style={{ borderRadius: 8 }}>
                <Menu.Label>{user?.email}</Menu.Label>
                <Menu.Divider />
                <Menu.Item onClick={() => navigate('/mypage')}>マイページ</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      {/* サイドバー */}
      <AppShell.Navbar
        style={{
          backgroundColor: sidebarBg,
          borderRight: isDark ? 'none' : '1px solid rgba(0,0,0,0.07)',
          zIndex: 1000,
        }}
      >
        <Box
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* ナビゲーション */}
          <Box p="sm" style={{ flex: 1, overflowY: 'auto' }}>
            <Stack gap={2}>{mainItems}</Stack>
          </Box>

          {/* アプリ名・フッター */}
          <Box
            px="md"
            py="md"
            style={{
              borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.07)',
            }}
          >
            <Title
              order={6}
              style={{
                color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)',
                fontWeight: 600,
                letterSpacing: '0.5px',
                cursor: 'pointer',
                marginBottom: 4,
              }}
              onClick={() => navigate('/reports')}
            >
              BS家計簿
            </Title>
            <Text
              size="xs"
              style={{
                color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)',
                cursor: 'pointer',
              }}
              onClick={() => navigate('/settings')}
            >
              利用規約 · プライバシーポリシー
            </Text>
          </Box>
        </Box>
      </AppShell.Navbar>

      <AppShell.Main>
        <Box
          style={(theme) => ({
            maxWidth: '1400px',
            margin: '0 auto',
            width: '100%',
            backgroundColor: colorScheme === 'dark' ? theme.colors.dark[8] : '#FDFCFB',
            padding: '24px',
            minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
          })}
        >
          {children}
        </Box>

        {/* モバイル用フローティングボタン */}
        <Affix position={{ bottom: 20, right: 20 }}>
          <ActionIcon
            size="xl"
            radius="xl"
            variant="filled"
            color={primaryColor}
            onClick={() => navigate('/journal-entry')}
            style={{
              backgroundColor: primaryShade[5],
              zIndex: 1000,
            }}
            hiddenFrom="sm"
          >
            <IconPlus size={24} />
          </ActionIcon>
        </Affix>
      </AppShell.Main>
    </AppShell>
  );
}
