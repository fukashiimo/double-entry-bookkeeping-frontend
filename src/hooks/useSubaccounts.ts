import { useState, useCallback } from 'react'
import type { Subaccount } from '../lib/supabase'

const supabaseUrl = 'https://iivyylojvqgucmbyfrqw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpdnl5bG9qdnFndWNtYnlmcnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NDg1NjcsImV4cCI6MjA3MzMyNDU2N30.ecmSicRrcBJd1sqFpxZc5Vx9Lls0HFBz5KMb4IEwD5Q'

export const useSubaccounts = () => {
  const [subaccounts, setSubaccounts] = useState<Subaccount[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSubaccounts = useCallback(async (accountId?: number) => {
    try {
      setLoading(true)
      setError(null)
      const url = new URL(`${supabaseUrl}/functions/v1/subaccounts`)
      if (accountId) url.searchParams.set('account_id', String(accountId))

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data: Subaccount[] = await response.json()
      setSubaccounts(data)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const createSubaccount = useCallback(async (accountId: number, name: string) => {
    const response = await fetch(`${supabaseUrl}/functions/v1/subaccounts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ account_id: accountId, name }),
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const created: Subaccount = await response.json()
    setSubaccounts(prev => [...prev, created])
    return created
  }, [])

  const updateSubaccount = useCallback(async (id: number, values: Partial<Pick<Subaccount, 'account_id' | 'name'>>) => {
    const response = await fetch(`${supabaseUrl}/functions/v1/subaccounts`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, ...values }),
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const updated: Subaccount = await response.json()
    setSubaccounts(prev => prev.map(s => s.id === id ? updated : s))
    return updated
  }, [])

  const deleteSubaccount = useCallback(async (id: number) => {
    const response = await fetch(`${supabaseUrl}/functions/v1/subaccounts?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    setSubaccounts(prev => prev.filter(s => s.id !== id))
    return true
  }, [])

  return { subaccounts, loading, error, fetchSubaccounts, createSubaccount, updateSubaccount, deleteSubaccount }
}






