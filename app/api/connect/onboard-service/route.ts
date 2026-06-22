import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripeAdmin } from '@/lib/stripeAdmin'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }
  const token = authHeader.replace('Bearer ', '')

  const { serviceId } = await request.json()
  if (!serviceId) {
    return NextResponse.json({ error: 'Missing serviceId' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const { data: service, error } = await supabase
    .from('farm_services')
    .select('id, stripe_account_id, created_by')
    .eq('id', serviceId)
    .single()

  if (error || !service || service.created_by !== user.id) {
    return NextResponse.json({ error: 'Service listing not found' }, { status: 400 })
  }

  const stripe = getStripeAdmin()
  let accountId = service.stripe_account_id

  if (!accountId) {
    const account = await stripe.accounts.create({ type: 'express' })
    accountId = account.id
    await supabase.from('farm_services').update({ stripe_account_id: accountId }).eq('id', service.id)
  }

  const origin = request.headers.get('origin') || new URL(request.url).origin

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/services`,
    return_url: `${origin}/services`,
    type: 'account_onboarding',
  })

  return NextResponse.json({ url: accountLink.url })
}
