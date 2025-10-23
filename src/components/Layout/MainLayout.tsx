import { useNavigate, useLocation } from 'react-router-dom';
import { AppShell, Burger, Group, Title, UnstyledButton, Text, Box, Stack, ActionIcon, Affix, Menu, Avatar } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconDashboard, 
  IconBook, 
  IconSettings,
  IconChartPie,
  IconPlus,
  IconList,
  IconLogout,
  IconUser
} from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';

const mainLinks = [
  { icon: IconDashboard, label: 'ダッシュボード', path: '/' },
  { icon: IconBook, label: '仕訳帳', path: '/journal-list' },
  { icon: IconPlus, label: '仕訳入力', path: '/journal-entry' },
  { icon: IconList, label: '勘定科目設定', path: '/account-settings' },
  { icon: IconChartPie, label: '財務レポート', path: '/reports' },
  { icon: IconSettings, label: '設定', path: '/settings' },
];

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

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
        style={(theme) => ({
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          borderRadius: theme.radius.md,
          color: isActive ? '#7566FF' : '#7A736C',
          backgroundColor: isActive ? '#E8E5FF' : 'transparent',
          '&:hover': {
            backgroundColor: isActive ? '#D1CCFF' : '#F7F5F3',
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
        <Group h="100%" px="xl" justify="space-between" style={{ backgroundColor: '#47A7EF' }}>
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
          
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle" size="lg" radius="xl">
                <Avatar size="sm" radius="xl" color="white">
                  {user?.email?.charAt(0).toUpperCase() || <IconUser size={20} />}
                </Avatar>
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>{user?.email}</Menu.Label>
              <Menu.Divider />
              <Menu.Item
                leftSection={<IconLogout size={16} />}
                onClick={handleSignOut}
                color="red"
              >
                ログアウト
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar 
        p="md" 
        style={{
          backgroundColor: '#F8F7FF',
          borderRight: '1px solid rgba(71, 51, 255, 0.2)',
          zIndex: 1000,
        }}
      >
        <Box p="md">
          <Text size="sm" fw={500} c="dimmed" mb="lg" px="md">
            メニュー
          </Text>
          <Stack gap="xs">{mainItems}</Stack>
        </Box>
      </AppShell.Navbar>

      <AppShell.Main>
        <Box
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            width: '100%',
            backgroundColor: '#FDFCFB',
            padding: '24px',
            minHeight: 'calc(100vh - 70px)',
          }}
        >
          {children}
        </Box>
        
        {/* モバイル用フローティングボタン */}
        <Affix position={{ bottom: 20, right: 20 }}>
          <ActionIcon
            size="xl"
            radius="xl"
            variant="filled"
            color="orange"
            onClick={() => navigate('/journal-entry')}
            style={{
              backgroundColor: '#FFB31E',
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