import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { fetchPlanSnapshot, type PlanSnapshot } from '../lib/billing'

interface EntitlementsState {
  loading: boolean
  isPro: boolean
  plan: PlanSnapshot
  refresh: () => Promise<void>
}

const DEFAULT_PLAN: PlanSnapshot = {
  planTier: 'free',
  planInterval: null,
  subscriptionStatus: null,
  currentPeriodEnd: null,
}

export function useEntitlements(): EntitlementsState {
  const { user } = useAuth()
  const [loading, setLoading] = useState<boolean>(true)
  const [plan, setPlan] = useState<PlanSnapshot>(DEFAULT_PLAN)

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setPlan(DEFAULT_PLAN)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const snapshot = await fetchPlanSnapshot(user.id)
      setPlan(snapshot)
    } catch {
      setPlan(DEFAULT_PLAN)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    loading,
    isPro: plan.planTier === 'pro',
    plan,
    refresh,
  }
}
