import { createClient } from '@supabase/supabase-js'

// Supabase設定
const supabaseUrl = 'https://iivyylojvqgucmbyfrqw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpdnl5bG9qdnFndWNtYnlmcnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NDg1NjcsImV4cCI6MjA3MzMyNDU2N30.ecmSicRrcBJd1sqFpxZc5Vx9Lls0HFBz5KMb4IEwD5Q'

// Supabaseクライアントの作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 型定義
export interface Account {
  id: number
  name: string
  type: '資産' | '負債' | '純資産' | '収益' | '費用'
  created_at: string
  updated_at: string
}

export interface JournalEntry {
  id: number
  date: string
  description: string
  debit_account_name: string
  debit_subaccount_name?: string | null
  credit_account_name: string
  credit_subaccount_name?: string | null
  amount: number
  created_at: string
  updated_at: string
}

export interface GroupedAccounts {
  assets: Account[]
  liabilities: Account[]
  equity: Account[]
  revenue: Account[]
  expenses: Account[]
}

export interface Subaccount {
  id: number
  account_id: number
  name: string
  created_at: string
  updated_at: string
}

