import { supabase, SUPABASE_URL } from './supabase'

export type BillingPlan = 'monthly' | 'yearly'

async function invokeAuthedFunction(path: string, body?: Record<string, unknown>) {
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token
  if (!accessToken) throw new Error('Not authenticated')

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body ?? {}),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Request failed: ${response.status}`)
  }

  return response.json()
}

export async function startProCheckout(plan: BillingPlan): Promise<void> {
  const json = await invokeAuthedFunction('payments-checkout', { plan })
  if (json?.url) {
    window.location.href = json.url as string
    return
  }
  throw new Error('Checkout URL is missing')
}

export async function openBillingPortal(): Promise<void> {
  const json = await invokeAuthedFunction('billing-portal')
  if (json?.url) {
    window.location.href = json.url as string
    return
  }
  throw new Error('Billing portal URL is missing')
}

export interface PlanSnapshot {
  planTier: 'free' | 'pro'
  planInterval: 'month' | 'year' | null
  subscriptionStatus: string | null
  currentPeriodEnd: string | null
}

export async function fetchPlanSnapshot(userId: string): Promise<PlanSnapshot> {
  const { data, error } = await supabase
    .from('profiles')
    .select('plan_tier, plan_interval, subscription_status, current_period_end')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error

  return {
    planTier: data?.plan_tier === 'pro' ? 'pro' : 'free',
    planInterval: data?.plan_interval === 'month' || data?.plan_interval === 'year' ? data.plan_interval : null,
    subscriptionStatus: data?.subscription_status ?? null,
    currentPeriodEnd: data?.current_period_end ?? null,
  }
}
