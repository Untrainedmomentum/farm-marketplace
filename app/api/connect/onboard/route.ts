import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripeAdmin } from '@/lib/stripeAdmin'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }
  const token = authHeader.replace('Bearer ', '')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const { data: farm, error } = await supabase
    .from('farms')
    .select('id, stripe_account_id')
    .eq('owner_id', user.id)
    .single()

  if (error || !farm) {
    return NextResponse.json({ error: 'No farm found for this account' }, { status: 400 })
  }

  const stripe = getStripeAdmin()
  let accountId = farm.stripe_account_id

  if (!accountId) {
    const account = await stripe.accounts.create({ type: 'express' })
    accountId = account.id
    await supabase.from('farms').update({ stripe_account_id: accountId }).eq('id', farm.id)
  }

  const origin = request.headers.get('origin') || new URL(request.url).origin

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/dashboard`,
    return_url: `${origin}/dashboard`,
    type: 'account_onboarding',
  })

  return NextResponse.json({ url: accountLink.url })
}
