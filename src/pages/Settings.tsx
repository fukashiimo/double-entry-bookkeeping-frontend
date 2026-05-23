import { Box, Paper, Stack, Text, Group, useComputedColorScheme } from '@mantine/core';
import { useTheme, type PrimaryColor } from '../contexts/ThemeContext';

const colorOptions: Array<{ value: PrimaryColor; label: string; color: string }> = [
  { value: 'orange', label: 'オレンジ', color: '#FFB31E' },
  { value: 'pastelPink', label: 'パステルピンク', color: '#FFB6C1' },
  { value: 'pastelBlue', label: 'パステルブルー', color: '#AED9E0' },
  { value: 'pastelGreen', label: 'パステルグリーン', color: '#B4E4B4' },
  { value: 'pastelYellow', label: 'パステルイエロー', color: '#FFFACD' },
  { value: 'pastelPurple', label: 'パステルパープル', color: '#E6E6FA' },
];

const Settings = () => {
  const { primaryColor, setPrimaryColor } = useTheme();
  const colorScheme = useComputedColorScheme('light');
  const isDark = colorScheme === 'dark';

  return (
    <Stack gap="xl">
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
                  border: `2px solid ${primaryColor === option.value ? option.color : isDark ? '#373A40' : '#dee2e6'}`,
                  backgroundColor: primaryColor === option.value
                    ? `${option.color}${isDark ? '28' : '18'}`
                    : isDark ? '#25262b' : '#f8f9fa',
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


