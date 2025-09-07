import { useState, useEffect } from 'react'
import { supabase, GroupedAccounts, Account } from '../lib/supabase'

export const useAccounts = () => {
  const [accounts, setAccounts] = useState<GroupedAccounts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      setError(null)

      // Edge Functions APIを使用
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/accounts`, {
        headers: {
          'Authorization': `Bearer ${supabase.supabaseKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
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
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/accounts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabase.supabaseKey}`,
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

  useEffect(() => {
    fetchAccounts()
  }, [])

  return {
    accounts,
    loading,
    error,
    refetch: fetchAccounts,
    createAccount,
  }
}
