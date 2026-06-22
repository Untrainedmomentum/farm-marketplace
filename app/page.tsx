import Image from 'next/image'
import Link from 'next/link'

const FEATURES = [
  { icon: '💳', title: 'Real checkout', desc: 'Pay securely by card at checkout — farmers get paid directly, no mailing a check or showing up with cash.' },
  { icon: '🗺️', title: 'Find what is near you', desc: 'Search by zip code to see farms, markets, and events within driving distance on a live map.' },
  { icon: '🧺', title: 'CSA programs', desc: 'Browse and join Community Supported Agriculture boxes right in the app — see what is in season and when.' },
  { icon: '🚚', title: 'Delivery, helpers & more', desc: 'Drivers deliver your order and get paid instantly. Farmers can post for seasonal help. All in one place.' },
]

export default function Home() {
  return (
    <main style={{ fontFamily: 'Georgia, serif' }}>
      <div style={{ position: 'relative', height: '60vh', minHeight: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <Image src="/images/tomatoes-cucumbers.jpg" alt="Fresh tomatoes and cucumbers" fill priority
          style={{ objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(44,24,16,0.55), rgba(44,24,16,0.75))' }} />
        <div style={{ position: 'relative', textAlign: 'center', padding: '0 1.5rem', maxWidth: 800 }}>
          <h1 style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', color: '#F5E6C8', marginBottom: 12, lineHeight: 1.15 }}>
            Fresh from the farm, straight to you
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: '#F0E0C0', marginBottom: 32 }}>
            Shop, subscribe, and connect with real local farms — with real checkout, not just a phone number to call.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/marketplace" style={{
              display: 'block', padding: '16px 36px', background: '#8B1A1A', color: '#F5E6C8',
              textDecoration: 'none', borderRadius: 8, fontSize: 17, boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
            }}>Browse Farms</Link>
            <Link href="/auth/signup" style={{
              display: 'block', padding: '16px 36px', background: '#5D8A3C', color: '#F5E6C8',
              textDecoration: 'none', borderRadius: 8, fontSize: 17, boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
            }}>Join as a Farmer</Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '4rem 2rem' }}>
        <h2 style={{ textAlign: 'center', color: '#8B1A1A', fontSize: '1.8rem', marginBottom: 8 }}>More than a directory</h2>
        <p style={{ textAlign: 'center', color: '#5D4E37', marginBottom: 40, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
          Most farm-finder sites just hand you a phone number. My Farm Express is a working marketplace.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ backgroundColor: '#FFFDF5', border: '1px solid #D4C5A9', borderRadius: 12, padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ color: '#8B1A1A', fontSize: '1.05rem', marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: '#5D4E37', fontSize: '0.9rem', lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative', padding: '4rem 2rem', textAlign: 'center', overflow: 'hidden' }}>
        <Image src="/images/basket-of-eggs.jpg" alt="Basket of fresh eggs" fill style={{ objectFit: 'cover', zIndex: -2 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(93,138,60,0.85)', zIndex: -1 }} />
        <h2 style={{ color: 'white', fontSize: '1.8rem', marginBottom: 16 }}>Ready to find your farm?</h2>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/map" style={{ display: 'block', padding: '14px 32px', background: '#F5E6C8', color: '#2C1810', textDecoration: 'none', borderRadius: 8, fontSize: 16 }}>
            🗺️ Explore the Map
          </Link>
          <Link href="/csa" style={{ display: 'block', padding: '14px 32px', background: 'transparent', border: '2px solid #F5E6C8', color: '#F5E6C8', textDecoration: 'none', borderRadius: 8, fontSize: 16 }}>
            🧺 Browse CSAs
          </Link>
        </div>
      </div>
    </main>
  )
}
