import { Box, Group, Stack, Text, useMantineTheme } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { useMemo } from 'react'

type DailyTotal = {
  date: string
  income: number
  expenses: number
}

type CalendarCell =
  | {
      key: string
      placeholder: true
    }
  | {
      key: string
      placeholder: false
      day: number
      totals: DailyTotal
    }

interface MonthlyCalendarProps {
  year: number
  month: number
  dailyTotals: DailyTotal[]
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

const formatCurrency = (value: number) => {
  if (!value) return '¥0'
  const sign = value > 0 ? '+' : '-'
  return `${sign}¥${Math.abs(Math.round(value)).toLocaleString()}`
}

export const MonthlyCalendar = ({ year, month, dailyTotals }: MonthlyCalendarProps) => {
  const theme = useMantineTheme()
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`)

  const totalsIndex = useMemo(() => {
    return dailyTotals.reduce<Record<string, DailyTotal>>((acc, item) => {
      acc[item.date] = item
      return acc
    }, {})
  }, [dailyTotals])

  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [year, month])
  const startDay = useMemo(() => new Date(year, month - 1, 1).getDay(), [year, month])
  const monthString = month.toString().padStart(2, '0')

  const cells = useMemo<CalendarCell[]>(() => {
    const placeholders = Array.from({ length: startDay }, (_, index) => ({
      key: `empty-${index}`,
      placeholder: true as const,
    }))

    const actualDays = Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1
      const dayString = day.toString().padStart(2, '0')
      const dateKey = `${year}-${monthString}-${dayString}`
      return {
        key: dateKey,
        dateKey,
        day,
        totals: totalsIndex[dateKey] ?? { date: dateKey, income: 0, expenses: 0 },
        placeholder: false as const,
      }
    })

    return [...placeholders, ...actualDays]
  }, [daysInMonth, monthString, startDay, totalsIndex, year])

  const gap = isMobile ? theme.spacing.xs : theme.spacing.sm
  const cellHeight = isMobile ? 96 : 132

  return (
    <Stack gap="xs">
      <Box
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap,
        }}
      >
        {WEEKDAYS.map((weekday) => (
          <Text
            key={weekday}
            ta="center"
            size={isMobile ? 'xs' : 'sm'}
            fw={600}
            c="dimmed"
          >
            {weekday}
          </Text>
        ))}
      </Box>

      <Box
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap,
        }}
      >
        {cells.map((cell) => {
          if (cell.placeholder) {
            return <Box key={cell.key} />
          }

          const { totals, day, key } = cell
          const hasTransactions = Math.abs(totals.income) > 0 || Math.abs(totals.expenses) > 0
          const background = hasTransactions
            ? theme.colors.orange?.[0] ?? theme.colors.gray[0]
            : theme.white

          return (
            <Box
              key={key}
              style={{
                borderRadius: theme.radius.md,
                border: `1px solid ${theme.colors.gray[3]}`,
                backgroundColor: background,
                padding: isMobile ? theme.spacing.xs : theme.spacing.sm,
                height: cellHeight,
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing.xs,
                overflow: 'hidden',
              }}
            >
              <Text fw={600} size={isMobile ? 'sm' : 'md'}>
                {day}
              </Text>
              <Stack gap={isMobile ? 4 : 6}>
                <Group gap={6} justify="space-between">
                  <Text size="xs" c="dimmed">
                    収入
                  </Text>
                  <Text
                    size={isMobile ? 'xs' : 'sm'}
                    fw={600}
                    c="green.6"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {formatCurrency(totals.income)}
                  </Text>
                </Group>
                <Group gap={6} justify="space-between">
                  <Text size="xs" c="dimmed">
                    支出
                  </Text>
                  <Text
                    size={isMobile ? 'xs' : 'sm'}
                    fw={600}
                    c="red.6"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {formatCurrency(totals.expenses)}
                  </Text>
                </Group>
              </Stack>
            </Box>
          )
        })}
      </Box>
    </Stack>
  )
}
