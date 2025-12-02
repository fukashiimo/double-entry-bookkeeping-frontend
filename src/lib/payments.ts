import { supabase, SUPABASE_URL } from './supabase'

export async function startAdRemovalCheckout(): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token
  if (!accessToken) throw new Error('Not authenticated')

  const resp = await fetch(`${SUPABASE_URL}/functions/v1/payments-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })
  if (!resp.ok) {
    const txt = await resp.text()
    throw new Error(`Checkout failed: ${txt}`)
  }
  const json = await resp.json()
  if (json?.url) {
    window.location.href = json.url as string
  }
}




