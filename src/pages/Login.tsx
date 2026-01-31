import { Container, Paper, Title, Text, Button, Stack, Box, useMantineTheme } from '@mantine/core'
import { useMantineColorScheme } from '@mantine/core'
import { IconBrandGoogle, IconBrandApple, IconBrandWindows } from '@tabler/icons-react'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'

export default function Login() {
  const { signInWithGoogle, signInWithApple, signInWithMicrosoft } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)
  const theme = useMantineTheme()
  const { colorScheme } = useMantineColorScheme()

  const handleGoogleSignIn = async () => {
    try {
      setLoading('google')
      await signInWithGoogle()
    } catch (error) {
      console.error('Google sign in error:', error)
      alert('Googleログインに失敗しました')
    } finally {
      setLoading(null)
    }
  }

  const handleAppleSignIn = async () => {
    try {
      setLoading('apple')
      await signInWithApple()
    } catch (error) {
      console.error('Apple sign in error:', error)
      alert('Appleログインに失敗しました')
    } finally {
      setLoading(null)
    }
  }

  const handleMicrosoftSignIn = async () => {
    try {
      setLoading('microsoft')
      await signInWithMicrosoft()
    } catch (error) {
      console.error('Microsoft sign in error:', error)
      alert('Microsoftログインに失敗しました')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Box
      style={{
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100vw',
        height: '100vh',
        display: 'grid',
        placeItems: 'center',
        backgroundColor: colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0],
      }}
    >
      <Container size={420} my={40}>
        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
          <Title ta="center" mb="md">
            複式簿記システム
          </Title>
          <Text c="dimmed" size="sm" ta="center" mb={30}>
            アカウントでログインしてください
          </Text>

          <Stack gap="md">
            <Button
              fullWidth
              leftSection={<IconBrandGoogle size={20} />}
              variant="default"
              onClick={handleGoogleSignIn}
              loading={loading === 'google'}
              disabled={loading !== null && loading !== 'google'}
            >
              Googleでログイン
            </Button>

            <Text c="dimmed" size="xs" ta="center">
              Apple / Microsoft ログインは現在準備中です
            </Text>

            <Button
              fullWidth
              leftSection={<IconBrandApple size={20} />}
              variant="default"
              onClick={handleAppleSignIn}
              loading={false}
              disabled
            >
              Appleでログイン（準備中）
            </Button>

            <Button
              fullWidth
              leftSection={<IconBrandWindows size={20} />}
              variant="default"
              onClick={handleMicrosoftSignIn}
              loading={false}
              disabled
            >
              Microsoftでログイン（準備中）
            </Button>
          </Stack>

          <Text c="dimmed" size="xs" ta="center" mt={30}>
            OAuth 2.0による安全な認証
          </Text>
        </Paper>
      </Container>
    </Box>
  )
}

