import { useState, useEffect } from 'react'

// Supabase設定を直接インポート
const supabaseUrl = 'https://iivyylojvqgucmbyfrqw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpdnl5bG9qdnFndWNtYnlmcnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NDg1NjcsImV4cCI6MjA3MzMyNDU2N30.ecmSicRrcBJd1sqFpxZc5Vx9Lls0HFBz5KMb4IEwD5Q'

export interface DashboardData {
  year: number
  month: number
  accounts: {
    assets: Array<{ id: number; name: string; type: string; created_at: string; updated_at: string }>
    liabilities: Array<{ id: number; name: string; type: string; created_at: string; updated_at: string }>
    equity: Array<{ id: number; name: string; type: string; created_at: string; updated_at: string }>
    revenue: Array<{ id: number; name: string; type: string; created_at: string; updated_at: string }>
    expenses: Array<{ id: number; name: string; type: string; created_at: string; updated_at: string }>
  }
  journalEntries: Array<{
    id: number
    date: string
    description: string
    debit_account_name: string
    debit_subaccount_name?: string | null
    credit_account_name: string
    credit_subaccount_name?: string | null
    amount: number
    created_at: string
  }>
  incomeData: Array<{ name: string; value: number }>
  expenseData: Array<{ name: string; value: number }>
  summary: {
    totalRevenue: number
    totalExpenses: number
    netIncome: number
  }
  balanceSheet: {
    assets: Array<{ name: string; amount: number }>
    liabilities: Array<{ name: string; amount: number }>
    equity: Array<{ name: string; amount: number }>
  }
}

export const useDashboard = (year?: number, month?: number) => {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 現在の年月を取得（パラメータがない場合）
      const now = new Date()
      const currentYear = year || now.getFullYear()
      const currentMonth = month || now.getMonth() + 1

      console.log('Fetching dashboard data for:', currentYear, currentMonth)

      // ダッシュボード専用APIを使用
      const response = await fetch(
        `${supabaseUrl}/functions/v1/dashboard?year=${currentYear}&month=${currentMonth}`,
        {
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const dashboardData: DashboardData = await response.json()
      console.log('Dashboard data received:', dashboardData)
      setData(dashboardData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [year, month])

  return {
    data,
    loading,
    error,
    refetch: fetchDashboardData
  }
}
