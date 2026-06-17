export default function Home() {
  return (
    <main style={{ padding: 60, maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: 48, color: '#8B1A1A', marginBottom: 8 }}>Welcome to My Farm Express</h1>
      <p style={{ fontSize: 20, color: '#5D4E37', marginBottom: 40 }}>Fresh local farm products delivered from our community farms to your table</p>
      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
        <a href="/marketplace" style={{
          display: 'block', padding: '20px 40px', background: '#8B1A1A', color: '#F5E6C8',
          textDecoration: 'none', borderRadius: 8, fontSize: 18, fontFamily: 'Georgia, serif'
        }}>Browse Farms</a>
        <a href="/dashboard" style={{
          display: 'block', padding: '20px 40px', background: '#5D8A3C', color: '#F5E6C8',
          textDecoration: 'none', borderRadius: 8, fontSize: 18, fontFamily: 'Georgia, serif'
        }}>Farmer Dashboard</a>
        <a href="/auth/signup" style={{
          display: 'block', padding: '20px 40px', background: '#8B6914', color: '#F5E6C8',
          textDecoration: 'none', borderRadius: 8, fontSize: 18, fontFamily: 'Georgia, serif'
        }}>Join as Farmer</a>
      </div>
    </main>
  )
}