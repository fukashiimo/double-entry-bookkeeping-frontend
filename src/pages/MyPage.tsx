import { useAuth } from '../contexts/AuthContext'
import { Button, Card, Group, Stack, Text } from '@mantine/core'
import { IconLogout } from '@tabler/icons-react'

export default function MyPage() {
  const { user, signOut } = useAuth()

  return (
    <Stack>
      <Card withBorder padding="lg" radius="md">
        <Stack>
          <Text size="sm" c="dimmed">ログイン中</Text>
          <Text fw={500}>{user?.email}</Text>
          <Group>
            <Button
              color="red"
              leftSection={<IconLogout size={16} />}
              onClick={async () => {
                await signOut()
                window.location.href = `${window.location.origin}/double-entry-bookkeeping-frontend/login`
              }}
            >
              ログアウト
            </Button>
          </Group>
        </Stack>
      </Card>
    </Stack>
  )
}
