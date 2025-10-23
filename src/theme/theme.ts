import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'orange',
  fontFamily: '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif',
  defaultRadius: 'xl',
  colors: {
    // メインカラー（パステルコーラル - チームみらい風）
    violet: [
      '#FFF8F5',
      '#FFE8E0',
      '#FFD4C2',
      '#FFBFA3',
      '#FFA680',
      '#FF8A5B',
      '#FF6B35',
      '#E55A2B',
      '#CC4A1F',
      '#B33A13',
    ],
    // 借方カラー（パステルグリーン - 自然な緑）
    green: [
      '#F7FDF9',
      '#E8F8F0',
      '#D1F2E1',
      '#A7E6C7',
      '#7DD3A8',
      '#52C084',
      '#3BAE6B',
      '#2E8B57',
      '#256845',
      '#1E4D33',
    ],
    // 貸方カラー（パステルピンク - 優しいピンク）
    red: [
      '#FFF8F8',
      '#FFE8E8',
      '#FFD1D1',
      '#FFB3B3',
      '#FF8A8A',
      '#FF6B6B',
      '#FF4D4D',
      '#E53E3E',
      '#CC2F2F',
      '#B32020',
    ],
    // アクセントカラー（パステルイエロー - 太陽の色）
    orange: [
      '#FFFDF7',
      '#FFF8E1',
      '#FFF0B3',
      '#FFE082',
      '#FFCC50',
      '#FFB31E',
      '#FF9800',
      '#E68900',
      '#CC7A00',
      '#B36B00',
    ],
    // パステルブルー（ヘッダー用）
    blue: [
      '#F7FBFF',
      '#E8F4FD',
      '#D1E9FB',
      '#A3D3F7',
      '#75BDF3',
      '#47A7EF',
      '#1F91EB',
      '#1A7BC7',
      '#1565A3',
      '#104F7F',
    ],
    // パステルパープル（サイドバー用）
    indigo: [
      '#F8F7FF',
      '#E8E5FF',
      '#D1CCFF',
      '#A399FF',
      '#7566FF',
      '#4733FF',
      '#2B1BCC',
      '#221499',
      '#190D66',
      '#100633',
    ],
    // グレースケール（温かみのあるベージュグレー）
    gray: [
      '#FDFCFB',
      '#F7F5F3',
      '#F0EDEA',
      '#E7E3E0',
      '#D1CCC7',
      '#B8B2AC',
      '#9C958E',
      '#7A736C',
      '#5A544F',
      '#3C3732',
    ],
  },
  components: {
    AppShell: {
      styles: {
        header: {
          backgroundColor: '#F7FBFF',
          borderBottom: '1px solid rgba(31, 145, 235, 0.2)',
        },
        navbar: {
          backgroundColor: '#F8F7FF',
          borderRight: '1px solid rgba(71, 51, 255, 0.2)',
        },
      },
    },
    Button: {
      defaultProps: {
        color: 'orange',
        radius: 'lg',
      },
      styles: {
        root: {
          border: '1px solid rgba(247, 147, 30, 0.3)',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(247, 147, 30, 0.05)',
            borderColor: 'rgba(247, 147, 30, 0.4)',
          },
        },
      },
    },
    ActionIcon: {
      defaultProps: {
        color: 'orange',
        radius: 'lg',
      },
      styles: {
        root: {
          border: '1px solid rgba(247, 147, 30, 0.2)',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(247, 147, 30, 0.05)',
            borderColor: 'rgba(247, 147, 30, 0.3)',
          },
        },
      },
    },
    Paper: {
      styles: {
        root: {
          border: '1px solid rgba(0, 0, 0, 0.08)',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: 'rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
    Card: {
      styles: {
        root: {
          border: '1px solid rgba(0, 0, 0, 0.08)',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: 'rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
    Table: {
      styles: {
        root: {
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid rgba(0, 0, 0, 0.08)',
        },
        thead: {
          backgroundColor: 'rgba(247, 147, 30, 0.03)',
        },
      },
    },
  },
});