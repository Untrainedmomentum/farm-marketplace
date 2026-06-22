'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

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
  const [checkingOutFarmId, setCheckingOutFarmId] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState('')

  useEffect(() => {
    loadCart()
  }, [])

  async function loadCart() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
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

  async function handleCheckout(farmId: string) {
    setCheckoutError('')
    setCheckingOutFarmId(farmId)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setCheckoutError('Please log in to check out.')
      setCheckingOutFarmId(null)
      return
    }
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ farmId }),
    })
    const data = await res.json()
    if (!res.ok || !data.url) {
      setCheckoutError(data.error || 'Checkout failed. Please try again.')
      setCheckingOutFarmId(null)
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
      {checkoutError && <p style={{ color: 'red' }}>{checkoutError}</p>}
      {Object.values(grouped).map((group: any) => {
        const subtotal = group.items.reduce((sum: number, i: CartItem) => sum + i.product.price * i.quantity, 0)
        const isCheckingOut = checkingOutFarmId === group.farmId
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <strong>Subtotal: ${subtotal.toFixed(2)}</strong>
              <button onClick={() => handleCheckout(group.farmId)} disabled={isCheckingOut}
                style={{ padding: '10px 20px', background: 'green', color: 'white', border: 'none', borderRadius: 8, cursor: isCheckingOut ? 'default' : 'pointer', fontSize: 15, opacity: isCheckingOut ? 0.7 : 1 }}>
                {isCheckingOut ? 'Redirecting to checkout...' : `Checkout with ${group.farm.name}`}
              </button>
            </div>
          </div>
        )
      })}
    </main>
  )
}
