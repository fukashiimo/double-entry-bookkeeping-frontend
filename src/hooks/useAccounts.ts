import { useState, useEffect } from 'react'
import type { GroupedAccounts, Account } from '../lib/supabase'

// Supabase設定を直接インポート
const supabaseUrl = 'https://iivyylojvqgucmbyfrqw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpdnl5bG9qdnFndWNtYnlmcnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NDg1NjcsImV4cCI6MjA3MzMyNDU2N30.ecmSicRrcBJd1sqFpxZc5Vx9Lls0HFBz5KMb4IEwD5Q'

export const useAccounts = () => {
  const [accounts, setAccounts] = useState<GroupedAccounts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      setError(null)

      // Edge Functions API を使用
      const response = await fetch(`${supabaseUrl}/functions/v1/accounts`, {
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Edge Functions API は既にグループ化されたデータを返す
      setAccounts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching accounts:', err)
    } finally {
      setLoading(false)
    }
  }

  const createAccount = async (name: string, type: Account['type']) => {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/accounts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, type }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const newAccount = await response.json()
      
      // ローカル状態を更新
      if (accounts) {
        const updatedAccounts = { ...accounts }
        switch (type) {
          case '資産':
            updatedAccounts.assets = [...updatedAccounts.assets, newAccount]
            break
          case '負債':
            updatedAccounts.liabilities = [...updatedAccounts.liabilities, newAccount]
            break
          case '純資産':
            updatedAccounts.equity = [...updatedAccounts.equity, newAccount]
            break
          case '収益':
            updatedAccounts.revenue = [...updatedAccounts.revenue, newAccount]
            break
          case '費用':
            updatedAccounts.expenses = [...updatedAccounts.expenses, newAccount]
            break
        }
        setAccounts(updatedAccounts)
      }

      return newAccount
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    }
  }

  const updateAccount = async (id: number, name: string, type: Account['type']) => {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/accounts`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, name, type }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const updatedAccount = await response.json()
      
      // ローカル状態を更新
      if (accounts) {
        const updatedAccounts = { ...accounts }
        
        // 古い勘定科目を削除
        Object.keys(updatedAccounts).forEach(key => {
          const accountType = key as keyof GroupedAccounts
          updatedAccounts[accountType] = updatedAccounts[accountType].filter(account => account.id !== id)
        })
        
        // 新しい勘定科目を追加
        switch (type) {
          case '資産':
            updatedAccounts.assets = [...updatedAccounts.assets, updatedAccount]
            break
          case '負債':
            updatedAccounts.liabilities = [...updatedAccounts.liabilities, updatedAccount]
            break
          case '純資産':
            updatedAccounts.equity = [...updatedAccounts.equity, updatedAccount]
            break
          case '収益':
            updatedAccounts.revenue = [...updatedAccounts.revenue, updatedAccount]
            break
          case '費用':
            updatedAccounts.expenses = [...updatedAccounts.expenses, updatedAccount]
            break
        }
        setAccounts(updatedAccounts)
      }

      return updatedAccount
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    }
  }

  const deleteAccount = async (id: number) => {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/accounts?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // ローカル状態を更新
      if (accounts) {
        const updatedAccounts = { ...accounts }
        Object.keys(updatedAccounts).forEach(key => {
          const accountType = key as keyof GroupedAccounts
          updatedAccounts[accountType] = updatedAccounts[accountType].filter(account => account.id !== id)
        })
        setAccounts(updatedAccounts)
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  return {
    accounts,
    loading,
    error,
    refetch: fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
  }
}

