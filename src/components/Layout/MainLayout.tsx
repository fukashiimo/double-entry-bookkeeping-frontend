import { useEffect } from 'react';
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
  // サイドバー: ダークシェード[9]を使用。ダークモードはさらに暗く
  const sidebarBg = isDark ? primaryShade[9] : primaryShade[9];
  const activeItemBg = 'rgba(255,255,255,0.18)';

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
          color: '#ffffff',
          backgroundColor: isActive ? activeItemBg : 'transparent',
          transition: 'all 0.15s ease',
          opacity: isActive ? 1 : 0.75,
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.08)';
            (e.currentTarget as HTMLElement).style.opacity = '1';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
            (e.currentTarget as HTMLElement).style.opacity = '0.75';
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
          backgroundColor: sidebarBg,
          borderBottom: 'none',
        }}
      >
        <Group h="100%" px="md" justify="space-between">
          <Group gap="xs">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
              color="rgba(255,255,255,0.8)"
            />
          </Group>

          <Group gap="xs">
            <ActionIcon
              variant="subtle"
              size="md"
              radius="xl"
              onClick={toggleColorScheme}
              aria-label="Toggle color scheme"
              style={{ color: 'rgba(255,255,255,0.75)' }}
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

      {/* ダークサイドバー */}
      <AppShell.Navbar
        style={{
          backgroundColor: sidebarBg,
          borderRight: 'none',
          zIndex: 1000,
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
        }}
      >
        <Box
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* アプリ名 */}
          <Box px="md" py="lg" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <Title
              order={4}
              style={{
                color: '#ffffff',
                fontWeight: 700,
                letterSpacing: '0.5px',
                cursor: 'pointer',
              }}
              onClick={() => navigate('/reports')}
            >
              BS家計簿
            </Title>
          </Box>

          {/* ナビゲーション */}
          <Box p="sm" style={{ flex: 1, overflowY: 'auto' }}>
            <Stack gap={2}>{mainItems}</Stack>
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
