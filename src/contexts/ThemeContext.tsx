import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

export type PrimaryColor = 'orange' | 'pastelPink' | 'pastelBlue' | 'pastelGreen' | 'pastelYellow' | 'pastelPurple'

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
const VALID_COLORS = ['orange', 'pastelPink', 'pastelBlue', 'pastelGreen', 'pastelYellow', 'pastelPurple']
const APP_TO_SERVER_COLOR: Record<PrimaryColor, string> = {
  orange: 'orange',
  pastelPink: 'red',
  pastelBlue: 'blue',
  pastelGreen: 'green',
  pastelYellow: 'orange',
  pastelPurple: 'violet',
}
const SERVER_TO_APP_COLOR: Record<string, PrimaryColor> = {
  orange: 'orange',
  red: 'pastelPink',
  blue: 'pastelBlue',
  green: 'pastelGreen',
  violet: 'pastelPurple',
  indigo: 'pastelPurple',
  pastelPink: 'pastelPink',
  pastelBlue: 'pastelBlue',
  pastelGreen: 'pastelGreen',
  pastelYellow: 'pastelYellow',
  pastelPurple: 'pastelPurple',
}

const getStoredColor = (): PrimaryColor | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw !== null && VALID_COLORS.includes(raw)) {
      return raw as PrimaryColor
    }
  } catch {
    // ignore storage errors
  }
  return null
}

const getInitialColor = (): PrimaryColor => {
  return getStoredColor() ?? 'orange'
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [primaryColor, setPrimaryColorState] = useState<PrimaryColor>(getInitialColor)
  const { user, loading } = useAuth()

  // サーバーの profiles.primary_color と同期
  useEffect(() => {
    const sync = async () => {
      if (loading) return
      if (!user) return
      // リロード時はローカル保存値を最優先
      const localColor = getStoredColor()
      if (localColor) {
        setPrimaryColorState(localColor)
        return
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('primary_color')
        .eq('user_id', user.id)
        .single()

      // 行が存在しない場合（PGRST116エラー）またはエラーメッセージに"row"が含まれる場合
      if (error && (error.code === 'PGRST116' || String(error.message).toLowerCase().includes('row'))) {
        // 行が無い -> ローカルストレージの値を使って作成
        const fallbackColor = getInitialColor()
        const { data: inserted, error: insertError } = await supabase
          .from('profiles')
          .insert([{ user_id: user.id, primary_color: APP_TO_SERVER_COLOR[fallbackColor] }])
          .select('primary_color')
          .single()
        if (inserted && inserted.primary_color) {
          const mapped = SERVER_TO_APP_COLOR[inserted.primary_color] ?? 'orange'
          setPrimaryColorState(mapped)
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
        const mapped = SERVER_TO_APP_COLOR[data.primary_color]
        if (!mapped) return
        setPrimaryColorState(mapped)
        // ローカルストレージも更新
        try {
          localStorage.setItem(STORAGE_KEY, mapped)
        } catch {
          // ignore
        }
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
    // ローカルストレージにも即座に保存
    try {
      localStorage.setItem(STORAGE_KEY, color)
    } catch {
      // ignore
    }
    // サーバーに保存（upsertで確実に保存）
    try {
      if (user) {
        const serverColor = APP_TO_SERVER_COLOR[color]
        await supabase
          .from('profiles')
          .upsert({ user_id: user.id, primary_color: serverColor }, { onConflict: 'user_id' })
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
