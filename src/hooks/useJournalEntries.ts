import { useState, useEffect } from 'react'
import { supabase, JournalEntry } from '../lib/supabase'

export const useJournalEntries = () => {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchJournalEntries = async () => {
    try {
      setLoading(true)
      setError(null)

      // Edge Functions APIを使用
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/journal-entries`, {
        headers: {
          'Authorization': `Bearer ${supabase.supabaseKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
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
    creditAccount: string
    amount: number
  }) => {
    try {
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/journal-entries`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabase.supabaseKey}`,
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

  useEffect(() => {
    fetchJournalEntries()
  }, [])

  return {
    journalEntries,
    loading,
    error,
    refetch: fetchJournalEntries,
    createJournalEntry,
  }
}
