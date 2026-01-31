import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

interface AdsContextType {
  adsEnabled: boolean
  enableAds: () => void
  disableAds: () => void
}

const AdsContext = createContext<AdsContextType | undefined>(undefined)

export const useAds = () => {
  const ctx = useContext(AdsContext)
  if (!ctx) throw new Error('useAds must be used within AdsProvider')
  return ctx
}

interface AdsProviderProps {
  children: ReactNode
}

const STORAGE_KEY = 'adsEnabled'

export const AdsProvider = ({ children }: AdsProviderProps) => {
  const [adsEnabled, setAdsEnabled] = useState<boolean>(true)
  const { user, loading } = useAuth()

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw !== null) {
        setAdsEnabled(raw === 'true')
      }
    } catch {
      // ignore storage errors
    }
  }, [])

  // サーバーの profiles.ads_enabled と同期
  useEffect(() => {
    const sync = async () => {
      if (loading) return
      if (!user) return
      const { data, error } = await supabase
        .from('profiles')
        .select('ads_enabled')
        .single()
      
      // 行が存在しない場合（PGRST116エラー）またはエラーメッセージに"row"が含まれる場合
      if (error && (error.code === 'PGRST116' || String(error.message).toLowerCase().includes('row'))) {
        // 行が無い -> 作成
        const { data: inserted, error: insertError } = await supabase
          .from('profiles')
          .insert([{ ads_enabled: true }])
          .select('ads_enabled')
          .single()
        if (inserted) {
          setAdsEnabled(Boolean(inserted.ads_enabled))
        } else if (insertError) {
          console.error('Error creating profile:', insertError)
        }
        return
      }
      
      if (error) {
        console.error('Error fetching profile:', error)
        return
      }
      
      if (data && typeof data.ads_enabled === 'boolean') {
        setAdsEnabled(Boolean(data.ads_enabled))
      }
    }
    sync()
  }, [user, loading])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(adsEnabled))
    } catch {
      // ignore storage errors
    }
  }, [adsEnabled])

  const value = useMemo(
    () => ({
      adsEnabled,
      enableAds: async () => {
        setAdsEnabled(true)
        try {
          if (user) await supabase.from('profiles').upsert({ ads_enabled: true })
        } catch {}
      },
      disableAds: async () => {
        setAdsEnabled(false)
        try {
          if (user) await supabase.from('profiles').upsert({ ads_enabled: false })
        } catch {}
      },
    }),
    [adsEnabled, user]
  )

  return <AdsContext.Provider value={value}>{children}</AdsContext.Provider>
}


