import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'indigo',
  fontFamily: 'Helvetica Neue, Arial, sans-serif',
  defaultRadius: 'md',
  colors: {
    // メインカラー（インディゴ）
    indigo: [
      '#EDF2FF',
      '#DBE4FF',
      '#BAC8FF',
      '#91A7FF',
      '#748FFC',
      '#5C7CFA',
      '#4C6EF5',
      '#4263EB',
      '#3B5BDB',
      '#364FC7',
    ],
    // アクセントカラー（ティール）
    teal: [
      '#E6FCF5',
      '#C3FAE8',
      '#96F2D7',
      '#63E6BE',
      '#38D9A9',
      '#20C997',
      '#12B886',
      '#0CA678',
      '#099268',
      '#087F5B',
    ],
    // グレースケール
    gray: [
      '#F8F9FA',
      '#F1F3F5',
      '#E9ECEF',
      '#DEE2E6',
      '#CED4DA',
      '#ADB5BD',
      '#868E96',
      '#495057',
      '#343A40',
      '#212529',
    ],
  },
  components: {
    AppShell: {
      styles: {
        header: {
          backgroundColor: 'var(--mantine-color-indigo-6)',
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
        color: 'indigo',
      },
    },
    ActionIcon: {
      defaultProps: {
        color: 'indigo',
      },
    },
  },
});