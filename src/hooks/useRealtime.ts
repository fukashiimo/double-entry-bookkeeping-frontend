import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

interface UseRealtimeOptions {
  onJournalChange?: () => void
  onAccountChange?: () => void
}

export const useRealtime = (options?: UseRealtimeOptions) => {
  // Use refs to avoid re-subscribing when callbacks change
  const onJournalChangeRef = useRef(options?.onJournalChange)
  const onAccountChangeRef = useRef(options?.onAccountChange)

  useEffect(() => {
    onJournalChangeRef.current = options?.onJournalChange
    onAccountChangeRef.current = options?.onAccountChange
  }, [options?.onJournalChange, options?.onAccountChange])

  useEffect(() => {
    // 勘定科目の変更を監視
    const accountsSubscription = supabase
      .channel('accounts:changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'accounts' },
        (payload) => {
          console.log('Account changed:', payload)
          onAccountChangeRef.current?.()
        }
      )
      .subscribe()

    // 仕訳の変更を監視
    const journalSubscription = supabase
      .channel('journal_entries:changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'journal_entries' },
        (payload) => {
          console.log('Journal entry changed:', payload)
          onJournalChangeRef.current?.()
        }
      )
      .subscribe()

    // クリーンアップ
    return () => {
      accountsSubscription.unsubscribe()
      journalSubscription.unsubscribe()
    }
  }, [])
}
