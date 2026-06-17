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

  const grouped = items.reduce((acc: any, item) => {
    const key = item.farm_id
    if (!acc[key]) acc[key] = { farm: item.farm, items: [] }
    acc[key].items.push(item)
    return acc
  }, {})

  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)

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
      {Object.values(grouped).map((group: any) => (
        <div key={group.farm.slug} style={{ marginBottom: 30 }}>
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
        </div>
      ))}
      <div style={{ borderTop: '1px solid #ccc', paddingTop: 20, marginTop: 20 }}>
        <h2>Total: ${total.toFixed(2)}</h2>
        <button style={{ padding: '12px 24px', background: 'green', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>
          Proceed to Checkout
        </button>
      </div>
    </main>
  )
}