import { createClient } from '@supabase/supabase-js'

// Supabase設定
const supabaseUrl = 'https://snwmoptdzwlrtfhdawrm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNud21vcHRkendscnRmaGRhd3JtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU2ODQ2NDksImV4cCI6MjA0MTI2MDY0OX0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'

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
  credit_account_name: string
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
