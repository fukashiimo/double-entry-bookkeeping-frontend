import { useNavigate, useLocation } from 'react-router-dom';
import { AppShell, Burger, Group, Title, UnstyledButton, Text, Box, Stack, ActionIcon, Affix, Menu, Avatar } from '@mantine/core';
import { useMantineColorScheme, useMantineTheme } from '@mantine/core';
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
import AdBanner from '../Ads/AdBanner';

const mainLinks = [
  { icon: IconChartPie, label: 'ダッシュボード', path: '/reports' },
  { icon: IconBook, label: '仕訳帳', path: '/journal-list' },
  { icon: IconPlus, label: '仕訳入力', path: '/journal-entry' },
  { icon: IconCalendarStats, label: 'カレンダー', path: '/calendar' },
  { icon: IconList, label: '勘定科目設定', path: '/account-settings' },
  { icon: IconSettings, label: '設定', path: '/settings' },
  { icon: IconUser, label: 'マイページ', path: '/mypage' },
];

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === 'dark';

  const toggleColorScheme = () => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');

  // プライマリカラーの取得
  const primaryColor = theme.primaryColor || 'orange';
  const primaryShade = theme.colors[primaryColor];

  const mainItems = mainLinks.map((link) => {
    const isActive = location.pathname === link.path;

    return (
      <UnstyledButton
        key={link.label}
        onClick={() => {
          navigate(link.path);
          if (opened) toggle();
        }}
        px="xl"
        py="md"
        style={() => ({
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          borderRadius: theme.radius.md,
          color: isActive
            ? isDark ? primaryShade[2] : primaryShade[6]
            : isDark ? theme.colors.gray[1] : '#7A736C',
          backgroundColor: isActive
            ? isDark ? `${primaryShade[6]}30` : `${primaryShade[1]}`
            : isDark ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
          '&:hover': {
            backgroundColor: isActive
              ? isDark ? `${primaryShade[6]}40` : `${primaryShade[2]}`
              : isDark ? 'rgba(255, 255, 255, 0.05)' : '#F7F5F3',
          },
          transition: 'all 0.2s ease',
        })}
      >
        <Box style={{ display: 'flex', alignItems: 'center' }}>
          <link.icon size={22} stroke={1.5} />
          <Text ml="md" size="sm" fw={isActive ? 500 : 400}>
            {link.label}
          </Text>
        </Box>
      </UnstyledButton>
    );
  });

  return (
    <AppShell
      header={{ height: 70 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened, desktop: false },
      }}
      padding="xl"
      style={{ minHeight: '100vh' }}
    >
      <AppShell.Header>
        <Group
          h="100%"
          px="xl"
          justify="space-between"
          style={() => ({
            backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : primaryShade[6],
          })}
        >
          <Group>
            <Burger 
              opened={opened} 
              onClick={toggle} 
              hiddenFrom="sm" 
              size="sm"
              color="white"
            />
            <Title order={3} c="white" style={{ fontWeight: 500 }}>複式簿記</Title>
          </Group>
          
          <Group gap="xs">
            <ActionIcon variant="subtle" size="lg" radius="xl" onClick={toggleColorScheme} aria-label="Toggle color scheme">
              {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
            </ActionIcon>

            <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle" size="lg" radius="xl">
                <Avatar size="sm" radius="xl" color="white">
                  {user?.email?.charAt(0).toUpperCase() || <IconUser size={20} />}
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

      <AppShell.Navbar
        p="md"
        style={() => ({
          backgroundColor: colorScheme === 'dark' ? theme.colors.dark[7] : primaryShade[0],
          borderRight: colorScheme === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : `1px solid ${primaryShade[2]}`,
          zIndex: 1000,
        })}
      >
        <Box 
          p="md"
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Text size="sm" fw={500} c="dimmed" mb="lg" px="md">
              メニュー
            </Text>
            <Stack gap="xs">{mainItems}</Stack>
          </Box>

          <Box mt="lg" />
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
            minHeight: 'calc(100vh - 70px)',
          })}
        >
          {children}
          <AdBanner placement="bottom" />
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
