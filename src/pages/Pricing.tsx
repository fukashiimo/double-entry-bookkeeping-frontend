import { useMemo, useState } from 'react'
import { Alert, Badge, Box, Button, Card, Divider, Group, List, SegmentedControl, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { IconAlertCircle, IconCheck } from '@tabler/icons-react'
import { startProCheckout, type BillingPlan } from '../lib/billing'
import { useEntitlements } from '../hooks/useEntitlements'

const FEATURES = [
  '仕訳辞書機能',
  '直前仕訳コピー機能',
  'CSV読み取り機能',
  '全期間の財務諸表等の閲覧',
  '補助科目機能',
  '科目残高推移表',
  '前年対比機能',
  '財務レポート機能',
  'CSV/PDFダウンロード',
  'アカウント連携',
]

export default function Pricing() {
  const [plan, setPlan] = useState<BillingPlan>('monthly')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const { isPro } = useEntitlements()

  const priceLabel = useMemo(() => {
    return plan === 'monthly' ? '月額 ¥480' : '年額 ¥4,800（2か月分お得）'
  }, [plan])

  const handleCheckout = async () => {
    setLoading(true)
    setError('')
    try {
      await startProCheckout(plan)
    } catch (err) {
      setError(err instanceof Error ? err.message : '決済ページの起動に失敗しました')
      setLoading(false)
    }
  }

  return (
    <Stack gap="xl">
      <Box>
        <Title order={2}>料金プラン</Title>
        <Text c="dimmed" mt={4}>Proプランで入力効率化と分析機能を解放します。</Text>
      </Box>

      {isPro && (
        <Alert color="green" icon={<IconCheck size={16} />} title="Proプラン利用中">
          すでにProプランが有効です。プラン変更や解約はマイページの「課金管理」から行えます。
        </Alert>
      )}

      {error && (
        <Alert color="red" icon={<IconAlertCircle size={16} />} title="決済エラー">
          {error}
        </Alert>
      )}

      <Card withBorder radius="md" p="xl">
        <Stack gap="md">
          <Group justify="space-between">
            <Title order={3}>Pro</Title>
            <Badge color="orange" variant="light">おすすめ</Badge>
          </Group>

          <SegmentedControl
            value={plan}
            onChange={(value) => setPlan(value as BillingPlan)}
            data={[
              { label: '月額', value: 'monthly' },
              { label: '年額', value: 'yearly' },
            ]}
          />

          <Text fw={700} size="xl">{priceLabel}</Text>
          <Button onClick={handleCheckout} loading={loading} disabled={loading || isPro}>
            {isPro ? '現在契約中' : 'Proプランを開始'}
          </Button>

          <Divider />
          <Text fw={600}>Proで使える機能</Text>
          <List
            spacing="xs"
            icon={
              <ThemeIcon color="teal" size={18} radius="xl">
                <IconCheck size={12} />
              </ThemeIcon>
            }
          >
            {FEATURES.map((feature) => (
              <List.Item key={feature}>{feature}</List.Item>
            ))}
          </List>
        </Stack>
      </Card>
    </Stack>
  )
}
