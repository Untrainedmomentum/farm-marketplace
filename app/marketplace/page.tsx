import { supabase } from '@/lib/supabase'

export default async function Marketplace() {
  const { data: farms } = await supabase.from('farms').select('*')

  return (
    <main style={{ padding: 40 }}>
      <h1>Farm Marketplace</h1>
      {farms && farms.length === 0 && <p>No farms yet.</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 20 }}>
        {farms?.map(farm => (
          <a key={farm.id} href={'/farm/' + farm.slug} style={{ border: '1px solid #ccc', borderRadius: 8, padding: 20, textDecoration: 'none', color: 'inherit' }}>
            <h2>{farm.name}</h2>
            {farm.cash_enabled && <p>Cash accepted</p>}
          </a>
        ))}
      </div>
    </main>
  )
}
