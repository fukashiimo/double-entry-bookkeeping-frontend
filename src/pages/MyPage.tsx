import { Box, Button, Card, Group, Stack, Text, Title } from '@mantine/core'
import { IconLogout, IconUser, IconAd } from '@tabler/icons-react'
import { useAuth } from '../contexts/AuthContext'
import { useAds } from '../contexts/AdsContext'
import { startAdRemovalCheckout } from '../lib/payments'

export default function MyPage() {
  const { user, signOut } = useAuth()
  const { adsEnabled, enableAds } = useAds()

  return (
    <Stack>
      <Group>
        <IconUser />
        <Title order={3}>マイページ</Title>
      </Group>

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

      <Card withBorder padding="lg" radius="md">
        <Group>
          <IconAd />
          <Title order={4}>広告</Title>
        </Group>
        <Box mt="sm">
          <Text size="sm" c="dimmed">
            現在の広告表示: {adsEnabled ? 'ON' : 'OFF'}
          </Text>
          <Group mt="md">
            {adsEnabled ? (
              <Button color="orange" onClick={async () => {
                await startAdRemovalCheckout()
              }}>
                広告を停止（決済に進む）
              </Button>
            ) : (
              <Button variant="light" onClick={enableAds}>広告を再表示</Button>
            )}
          </Group>
        </Box>
      </Card>
    </Stack>
  )
}


