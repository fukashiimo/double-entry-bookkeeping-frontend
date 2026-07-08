import { createClient } from '@supabase/supabase-js'

// Supabase設定（環境変数から取得）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Supabaseクライアントの作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const SUPABASE_URL = supabaseUrl

// 型定義
export interface Account {
  id: number
  name: string
  type: '資産' | '負債' | '純資産' | '収益' | '費用'
  sort_order?: number
  is_system?: boolean
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

