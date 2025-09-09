import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useRealtime = () => {
  useEffect(() => {
    // 勘定科目の変更を監視
    const accountsSubscription = supabase
      .channel('accounts:changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'accounts' },
        (payload) => {
          console.log('Account changed:', payload)
          // 必要に応じてグローバル状態を更新
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
          // 必要に応じてグローバル状態を更新
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

