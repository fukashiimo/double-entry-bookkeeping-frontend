import { Container, Paper, Title, Text, Button, Stack, Center } from '@mantine/core'
import { IconBrandGoogle, IconBrandApple, IconBrandWindows } from '@tabler/icons-react'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'

export default function Login() {
  const { signInWithGoogle, signInWithApple, signInWithMicrosoft } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)

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
    <Center style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
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

            <Button
              fullWidth
              leftSection={<IconBrandApple size={20} />}
              variant="default"
              onClick={handleAppleSignIn}
              loading={loading === 'apple'}
              disabled={loading !== null && loading !== 'apple'}
            >
              Appleでログイン
            </Button>

            <Button
              fullWidth
              leftSection={<IconBrandWindows size={20} />}
              variant="default"
              onClick={handleMicrosoftSignIn}
              loading={loading === 'microsoft'}
              disabled={loading !== null && loading !== 'microsoft'}
            >
              Microsoftでログイン
            </Button>
          </Stack>

          <Text c="dimmed" size="xs" ta="center" mt={30}>
            OAuth 2.0による安全な認証
          </Text>
        </Paper>
      </Container>
    </Center>
  )
}

