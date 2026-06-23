'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const SERVICE_FEE = 2

type CartItem = {
  id: string
  product_id: string
  farm_id: string
  quantity: number
  product: {
    name: string
    price: number
    description: string
  }
  farm: {
    name: string
    slug: string
  }
}

export default function Cart() {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [isGuest, setIsGuest] = useState(false)

  useEffect(() => {
    loadCart()
  }, [])

  async function loadCart() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    setIsGuest(!!user.is_anonymous)
    const { data } = await supabase
      .from('cart_items')
      .select('*, product:products(name, price, description), farm:farms(name, slug)')
      .eq('user_id', user.id)
    setItems(data || [])
    setLoading(false)
  }

  async function removeItem(id: string) {
    await supabase.from('cart_items').delete().eq('id', id)
    setItems(items.filter(i => i.id !== id))
  }

  async function updateQty(id: string, qty: number) {
    if (qty < 1) { removeItem(id); return }
    await supabase.from('cart_items').update({ quantity: qty }).eq('id', id)
    setItems(items.map(i => i.id === id ? { ...i, quantity: qty } : i))
  }

  async function handleCheckout() {
    setCheckoutError('')
    setCheckingOut(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setCheckoutError('Please log in to check out.')
      setCheckingOut(false)
      return
    }
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    if (!res.ok || !data.url) {
      setCheckoutError(data.error || 'Checkout failed. Please try again.')
      setCheckingOut(false)
      return
    }
    window.location.href = data.url
  }

  const grouped = items.reduce((acc: any, item) => {
    const key = item.farm_id
    if (!acc[key]) acc[key] = { farm: item.farm, farmId: item.farm_id, items: [] }
    acc[key].items.push(item)
    return acc
  }, {})

  const cartTotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
  const farmCount = Object.keys(grouped).length

  if (loading) return <main style={{ padding: 40 }}><p>Loading...</p></main>
  if (items.length === 0) return (
    <main style={{ padding: 40 }}>
      <h1>Your Cart</h1>
      <p>Your cart is empty. <a href="/marketplace">Browse farms</a></p>
    </main>
  )

  return (
    <main style={{ padding: 40 }}>
      <h1>Your Cart</h1>
      {isGuest && (
        <p style={{ background: '#FFF8E1', border: '1px solid #F0C040', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.9rem', color: '#5D4E37', marginBottom: '1.5rem' }}>
          🛒 You're checking out as a guest. <a href="/auth/signup" style={{ color: 'var(--barn-red)', fontWeight: 'bold' }}>Create a free account</a> to track your orders and reorder faster next time.
        </p>
      )}
      {checkoutError && <p style={{ color: 'red' }}>{checkoutError}</p>}
      {Object.values(grouped).map((group: any) => {
        const subtotal = group.items.reduce((sum: number, i: CartItem) => sum + i.product.price * i.quantity, 0)
        return (
          <div key={group.farm.slug} style={{ marginBottom: 30, borderBottom: '1px solid #ccc', paddingBottom: 20 }}>
            <h2>{group.farm.name}</h2>
            {group.items.map((item: CartItem) => (
              <div key={item.id} style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{item.product.name}</strong>
                  <p style={{ margin: 0 }}>${item.product.price} each</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button onClick={() => updateQty(item.id, item.quantity - 1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                  <button onClick={() => removeItem(item.id)}>Remove</button>
                </div>
              </div>
            ))}
            <div style={{ textAlign: 'right', marginTop: 8 }}>
              <strong>Subtotal: ${subtotal.toFixed(2)}</strong>
            </div>
          </div>
        )
      })}

      <div style={{ marginTop: 20, padding: 20, background: '#FFFDF5', border: '1px solid #D4C5A9', borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span>Items ({farmCount} farm{farmCount > 1 ? 's' : ''})</span>
          <span>${cartTotal.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, color: '#666', fontSize: 14 }}>
          <span>Service fee</span>
          <span>${SERVICE_FEE.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 'bold', borderTop: '1px solid #D4C5A9', paddingTop: 10, marginTop: 10 }}>
          <span>Total</span>
          <span>${(cartTotal + SERVICE_FEE).toFixed(2)}</span>
        </div>
        <p style={{ color: '#888', fontSize: 12, margin: '8px 0 16px' }}>
          One flat ${SERVICE_FEE} fee no matter how many farms are in your cart — every farm gets 100% of their sale.{' '}
          <a href="/fees" style={{ color: '#888', textDecoration: 'underline' }}>See all fees</a>
        </p>
        <button onClick={handleCheckout} disabled={checkingOut}
          style={{ width: '100%', padding: '14px 20px', background: 'green', color: 'white', border: 'none', borderRadius: 8, cursor: checkingOut ? 'default' : 'pointer', fontSize: 16, opacity: checkingOut ? 0.7 : 1 }}>
          {checkingOut ? 'Redirecting to checkout...' : `Checkout — $${(cartTotal + SERVICE_FEE).toFixed(2)}`}
        </button>
      </div>
    </main>
  )
}
