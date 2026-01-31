import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

export type PrimaryColor = 'orange' | 'blue' | 'green' | 'violet' | 'indigo' | 'red'

interface ThemeContextType {
  primaryColor: PrimaryColor
  setPrimaryColor: (color: PrimaryColor) => Promise<void>
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

interface ThemeProviderProps {
  children: ReactNode
}

const STORAGE_KEY = 'primaryColor'

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [primaryColor, setPrimaryColorState] = useState<PrimaryColor>('orange')
  const { user, loading } = useAuth()

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw !== null && ['orange', 'blue', 'green', 'violet', 'indigo', 'red'].includes(raw)) {
        setPrimaryColorState(raw as PrimaryColor)
      }
    } catch {
      // ignore storage errors
    }
  }, [])

  // サーバーの profiles.primary_color と同期
  useEffect(() => {
    const sync = async () => {
      if (loading) return
      if (!user) return
      const { data, error } = await supabase
        .from('profiles')
        .select('primary_color')
        .single()
      
      // 行が存在しない場合（PGRST116エラー）またはエラーメッセージに"row"が含まれる場合
      if (error && (error.code === 'PGRST116' || String(error.message).toLowerCase().includes('row'))) {
        // 行が無い -> 作成
        const { data: inserted, error: insertError } = await supabase
          .from('profiles')
          .insert([{ primary_color: 'orange' }])
          .select('primary_color')
          .single()
        if (inserted && inserted.primary_color) {
          setPrimaryColorState(inserted.primary_color as PrimaryColor)
        } else if (insertError) {
          console.error('Error creating profile:', insertError)
        }
        return
      }
      
      if (error) {
        console.error('Error fetching profile:', error)
        return
      }
      
      if (data && data.primary_color) {
        setPrimaryColorState(data.primary_color as PrimaryColor)
      }
    }
    sync()
  }, [user, loading])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, primaryColor)
    } catch {
      // ignore storage errors
    }
  }, [primaryColor])

  const setPrimaryColor = async (color: PrimaryColor) => {
    setPrimaryColorState(color)
    try {
      if (user) {
        await supabase.from('profiles').upsert({ primary_color: color })
      }
    } catch (error) {
      console.error('Error updating primary color:', error)
    }
  }

  const value = useMemo(
    () => ({
      primaryColor,
      setPrimaryColor,
    }),
    [primaryColor]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
