import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'

export default async function FarmPage({ params }: { params: { slug: string } }) {
  const { data: farm } = await supabase.from('farms').select('*').eq('slug', params.slug).single()
  if (!farm) notFound()

  const { data: products } = await supabase.from('products').select('*').eq('farm_id', farm.id).eq('active', true)

  return (
    <main style={{ padding: 40 }}>
      <h1>{farm.name}</h1>
      {farm.cash_enabled && <p>Cash accepted</p>}
      <h2>Products</h2>
      {!products?.length && <p>No products yet.</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 20 }}>
        {products?.map(product => (
          <div key={product.id} style={{ border: '1px solid #ccc', borderRadius: 8, padding: 20 }}>
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p><strong>{product.price}</strong></p>
            <p>In stock: {product.quantity}</p>
            <button>Add to cart</button>
          </div>
        ))}
      </div>
    </main>
  )
}
