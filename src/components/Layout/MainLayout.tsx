import { useNavigate, useLocation } from 'react-router-dom';
import { AppShell, Burger, Group, Title, UnstyledButton, Text, Box, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconDashboard, 
  IconBook, 
  IconSettings,
  IconChartPie,
  IconPlus,
  IconList
} from '@tabler/icons-react';

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
          color: isActive ? theme.colors.indigo[7] : theme.colors.gray[7],
          backgroundColor: isActive ? theme.colors.indigo[0] : 'transparent',
          '&:hover': {
            backgroundColor: isActive ? theme.colors.indigo[1] : theme.colors.gray[0],
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
        <Group h="100%" px="xl" style={{ backgroundColor: 'var(--mantine-color-indigo-6)' }}>
          <Burger 
            opened={opened} 
            onClick={toggle} 
            hiddenFrom="sm" 
            size="sm"
            color="white"
          />
          <Title order={3} c="white" style={{ fontWeight: 500 }}>複式簿記</Title>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar 
        p="md" 
        style={(theme) => ({
          backgroundColor: theme.white,
          borderRight: `1px solid ${theme.colors.gray[2]}`,
          zIndex: 1000,
        })}
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
          style={(theme) => ({
            maxWidth: '1400px',
            margin: '0 auto',
            width: '100%',
            backgroundColor: theme.colors.gray[0],
            padding: theme.spacing.xl,
            minHeight: 'calc(100vh - 70px)',
          })}
        >
          {children}
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}