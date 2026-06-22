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

  const { data: cartItems, error } = await supabase
    .from('cart_items')
    .select('id, quantity, product:products(name, price)')
    .eq('user_id', user.id)

  if (error || !cartItems?.length) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }

  const origin = request.headers.get('origin') || new URL(request.url).origin

  const session = await getStripeAdmin().checkout.sessions.create({
    mode: 'payment',
    line_items: cartItems.map((item) => {
      const product = item.product as unknown as { name: string; price: number }
      return {
        price_data: {
          currency: 'usd',
          product_data: { name: product.name },
          unit_amount: Math.round(Number(product.price) * 100),
        },
        quantity: item.quantity,
      }
    }),
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cart`,
    metadata: { user_id: user.id },
  })

  return NextResponse.json({ url: session.url })
}
