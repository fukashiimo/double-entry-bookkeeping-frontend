import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Badge, Button, Card, Group, Loader, Stack, Text, Title } from '@mantine/core'
import { IconLogout, IconUser } from '@tabler/icons-react'
import { useAuth } from '../contexts/AuthContext'
import { useEntitlements } from '../hooks/useEntitlements'
import { openBillingPortal } from '../lib/billing'

export default function MyPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { loading, isPro, plan } = useEntitlements()
  const [billingError, setBillingError] = useState<string>('')

  const checkoutResult = searchParams.get('checkout')
  const currentPlanLabel = useMemo(() => {
    if (loading) return '読み込み中'
    if (plan.planTier !== 'pro') return 'Free'
    return plan.planInterval === 'year' ? 'Pro（年額）' : 'Pro（月額）'
  }, [loading, plan.planTier, plan.planInterval])

  return (
    <Stack>
      <Group>
        <IconUser />
        <Title order={3}>マイページ</Title>
      </Group>

      {checkoutResult === 'success' && (
        <Alert color="green" title="決済完了">
          Proプランの決済が完了しました。反映まで数秒かかる場合があります。
        </Alert>
      )}
      {checkoutResult === 'cancel' && (
        <Alert color="yellow" title="決済キャンセル">
          決済はキャンセルされました。必要に応じて再度お試しください。
        </Alert>
      )}
      {billingError && (
        <Alert color="red" title="課金管理エラー">
          {billingError}
        </Alert>
      )}

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
        <Stack>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">現在のプラン</Text>
            <Badge color={isPro ? 'green' : 'gray'}>{currentPlanLabel}</Badge>
          </Group>

          {loading && <Loader size="sm" />}

          {!loading && (
            <Group>
              {!isPro && (
                <Button onClick={() => navigate('/pricing')}>
                  Proプランを見る
                </Button>
              )}
              {isPro && (
                <Button
                  variant="light"
                  onClick={async () => {
                    setBillingError('')
                    try {
                      await openBillingPortal()
                    } catch (err) {
                      setBillingError(err instanceof Error ? err.message : '課金管理ページを開けませんでした')
                    }
                  }}
                >
                  課金管理（解約・支払い方法変更）
                </Button>
              )}
            </Group>
          )}
        </Stack>
      </Card>
    </Stack>
  )
}
