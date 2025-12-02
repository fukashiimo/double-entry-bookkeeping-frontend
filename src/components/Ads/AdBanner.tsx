import { Box, Group, Text, UnstyledButton } from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import { useAds } from '../../contexts/AdsContext'
import { useMantineColorScheme, useMantineTheme } from '@mantine/core'

interface AdBannerProps {
  placement?: 'top' | 'bottom'
}

export default function AdBanner({ placement = 'bottom' }: AdBannerProps) {
  const { adsEnabled, disableAds } = useAds()
  const { colorScheme } = useMantineColorScheme()
  const theme = useMantineTheme()

  if (!adsEnabled) return null

  return (
    <Box
      p="md"
      mt={placement === 'top' ? 'md' : undefined}
      mb={placement === 'bottom' ? 'md' : undefined}
      style={{
        border: colorScheme === 'dark' ? '1px dashed rgba(255,255,255,0.2)' : '1px dashed #C1C2C5',
        borderRadius: 8,
        background: colorScheme === 'dark' ? theme.colors.dark[6] : '#FFFBF0',
      }}
    >
      <Group justify="space-between" align="center">
        <Text size="sm" c="dimmed">
          広告（プレースホルダー）
        </Text>
        <UnstyledButton onClick={disableAds}>
          <Group gap={6}>
            <IconX size={14} />
            <Text size="xs" c="dimmed">広告を非表示</Text>
          </Group>
        </UnstyledButton>
      </Group>
      <Box
        mt="sm"
        style={{
          height: 80,
          background: colorScheme === 'dark' ? theme.colors.dark[7] : '#FFF5D6',
          borderRadius: 6,
        }}
      />
    </Box>
  )
}


