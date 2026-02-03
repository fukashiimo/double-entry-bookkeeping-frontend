import { useState, useEffect } from 'react'
import type { JournalEntry } from '../lib/supabase'
import { supabase } from '../lib/supabase'

// Supabase設定を直接インポート
const supabaseUrl = 'https://iivyylojvqgucmbyfrqw.supabase.co'

export const useJournalEntries = () => {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchJournalEntries = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) throw new Error('Unauthorized: no access token')
      // Edge Functions API を使用（ユーザーのアクセストークンで呼び出し）
      const response = await fetch(`${supabaseUrl}/functions/v1/journal-entries`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: JournalEntry[] = await response.json()
      setJournalEntries(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching journal entries:', err)
    } finally {
      setLoading(false)
    }
  }

  const createJournalEntry = async (entryData: {
    date: string
    description: string
    debitAccount: string
    debitSubaccount?: string | null
    creditAccount: string
    creditSubaccount?: string | null
    amount: number
  }) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) throw new Error('Unauthorized: no access token')
      const response = await fetch(`${supabaseUrl}/functions/v1/journal-entries`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entryData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const newEntry = await response.json()

      // ローカル状態を更新
      setJournalEntries(prev => [newEntry, ...prev])

      return newEntry
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    }
  }

  const updateJournalEntry = async (entryData: {
    id: number
    date: string
    description: string
    debitAccount: string
    debitSubaccount?: string | null
    creditAccount: string
    creditSubaccount?: string | null
    amount: number
  }) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) throw new Error('Unauthorized: no access token')
      const response = await fetch(`${supabaseUrl}/functions/v1/journal-entries`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entryData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const updatedEntry = await response.json()

      // ローカル状態を更新
      setJournalEntries(prev =>
        prev.map(entry => entry.id === updatedEntry.id ? updatedEntry : entry)
      )

      return updatedEntry
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    }
  }

  const deleteJournalEntry = async (id: number) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) throw new Error('Unauthorized: no access token')
      const response = await fetch(`${supabaseUrl}/functions/v1/journal-entries`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // ローカル状態を更新
      setJournalEntries(prev => prev.filter(entry => entry.id !== id))

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    }
  }

  useEffect(() => {
    fetchJournalEntries()
  }, [])

  return {
    journalEntries,
    loading,
    error,
    refetch: fetchJournalEntries,
    createJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
  }
}

