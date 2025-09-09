import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'Helvetica Neue, Arial, sans-serif',
  defaultRadius: 'md',
  colors: {
    // メインカラー（ブルー - 信頼感）
    blue: [
      '#EFF6FF',
      '#DBEAFE',
      '#BFDBFE',
      '#93C5FD',
      '#60A5FA',
      '#3B82F6',
      '#2563EB',
      '#1D4ED8',
      '#1E40AF',
      '#1E3A8A',
    ],
    // 借方カラー（グリーン - 資産・費用）
    green: [
      '#F0FDF4',
      '#DCFCE7',
      '#BBF7D0',
      '#86EFAC',
      '#4ADE80',
      '#22C55E',
      '#16A34A',
      '#15803D',
      '#166534',
      '#14532D',
    ],
    // 貸方カラー（レッド - 負債・収益）
    red: [
      '#FEF2F2',
      '#FEE2E2',
      '#FECACA',
      '#FCA5A5',
      '#F87171',
      '#EF4444',
      '#DC2626',
      '#B91C1C',
      '#991B1B',
      '#7F1D1D',
    ],
    // アクセントカラー（オレンジ - 警告・注意）
    orange: [
      '#FFF7ED',
      '#FFEDD5',
      '#FED7AA',
      '#FDBA74',
      '#FB923C',
      '#F97316',
      '#EA580C',
      '#DC2626',
      '#B91C1C',
      '#991B1B',
    ],
    // グレースケール
    gray: [
      '#F9FAFB',
      '#F3F4F6',
      '#E5E7EB',
      '#D1D5DB',
      '#9CA3AF',
      '#6B7280',
      '#4B5563',
      '#374151',
      '#1F2937',
      '#111827',
    ],
  },
  components: {
    AppShell: {
      styles: {
        header: {
          backgroundColor: 'var(--mantine-color-blue-6)',
          borderBottom: 'none',
        },
        navbar: {
          backgroundColor: '#fff',
          borderRight: '1px solid var(--mantine-color-gray-2)',
        },
      },
    },
    Button: {
      defaultProps: {
        color: 'blue',
      },
    },
    ActionIcon: {
      defaultProps: {
        color: 'blue',
      },
    },
  },
});