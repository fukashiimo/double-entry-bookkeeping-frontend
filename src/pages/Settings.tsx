import { Box, Title, Paper, Stack, Text, Group } from '@mantine/core';
import { useTheme, type PrimaryColor } from '../contexts/ThemeContext';

const colorOptions: Array<{ value: PrimaryColor; label: string; color: string }> = [
  { value: 'orange', label: 'オレンジ', color: '#FFB31E' },
  { value: 'blue', label: 'ブルー', color: '#1F91EB' },
  { value: 'green', label: 'グリーン', color: '#3BAE6B' },
  { value: 'violet', label: 'バイオレット', color: '#7566FF' },
  { value: 'indigo', label: 'インディゴ', color: '#4733FF' },
  { value: 'red', label: 'レッド', color: '#E53E3E' },
];

const Settings = () => {
  const { primaryColor, setPrimaryColor } = useTheme();

  return (
    <Stack gap="xl">
      <Box>
        <Title order={1} mb="md">
          設定
        </Title>
      </Box>

      <Paper p="xl" radius="md" withBorder>
        <Stack gap="md">
          <Box>
            <Text size="lg" fw={600} mb="xs">
              カラーテーマ
            </Text>
            <Text size="sm" c="dimmed" mb="md">
              アプリケーション全体のメインカラーを選択できます
            </Text>
          </Box>

          <Group gap="md" wrap="wrap">
            {colorOptions.map((option) => (
              <Box
                key={option.value}
                onClick={() => setPrimaryColor(option.value)}
                style={{
                  cursor: 'pointer',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  border: `2px solid ${primaryColor === option.value ? option.color : 'transparent'}`,
                  backgroundColor: primaryColor === option.value 
                    ? `${option.color}15` 
                    : 'var(--mantine-color-gray-0)',
                  transition: 'all 0.2s ease',
                  flex: '1 1 auto',
                  minWidth: '120px',
                }}
              >
                <Group gap="xs" justify="center">
                  <Box
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: option.color,
                      border: '2px solid rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Text size="sm" fw={primaryColor === option.value ? 600 : 400}>
                    {option.label}
                  </Text>
                </Group>
              </Box>
            ))}
          </Group>
        </Stack>
      </Paper>
    </Stack>
  );
};

export default Settings;


