'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ensureUser } from '@/lib/ensureUser'

export default function AddToCartButton({ productId, farmId }: { productId: string, farmId: string }) {
  const [message, setMessage] = useState('')

  async function addToCart() {
    const user = await ensureUser().catch(() => null)
    if (!user) { setMessage('Could not start your cart. Please try again.'); return }

    const { data: existing } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .single()

    if (existing) {
      await supabase.from('cart_items').update({ quantity: existing.quantity + 1 }).eq('id', existing.id)
    } else {
      await supabase.from('cart_items').insert({
        user_id: user.id,
        product_id: productId,
        farm_id: farmId,
        quantity: 1
      })
    }
    setMessage('Added to cart!')
    setTimeout(() => setMessage(''), 2000)
  }

  return (
    <div>
      <button onClick={addToCart} style={{ padding: '8px 16px', background: 'green', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
        Add to Cart
      </button>
      {message && <p style={{ color: 'green', fontSize: 12, margin: '4px 0 0' }}>{message}</p>}
    </div>
  )
}
