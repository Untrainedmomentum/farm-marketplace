'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function EditStorePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [farm, setFarm] = useState<any>(null)

  const [farmName, setFarmName] = useState('')
  const [headerColor, setHeaderColor] = useState('#8B1A1A')
  const [bgColor, setBgColor] = useState('#FFFDF5')
  const [textColor, setTextColor] = useState('#2C1810')
  const [accentColor, setAccentColor] = useState('#5D8A3C')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [hasWebsite, setHasWebsite] = useState(false)
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [wantsCustomSite, setWantsCustomSite] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }
      setUserId(session.user.id)

      const { data: farm } = await supabase.from('farms').select('*').eq('owner_id', session.user.id).single()
      if (!farm) { router.push('/onboarding'); return }

      setFarm(farm)
      setFarmName(farm.name)
      if (farm.logo_url?.startsWith('http')) setLogoPreview(farm.logo_url)

      if (farm.color_theme) {
        try {
          const t = JSON.parse(farm.color_theme)
          if (t.header) setHeaderColor(t.header)
          if (t.bg) setBgColor(t.bg)
          if (t.text) setTextColor(t.text)
          if (t.accent) setAccentColor(t.accent)
        } catch {}
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setMessage('')

    try {
      let logoUrl = farm.logo_url
      if (logoFile && userId) {
        const ext = logoFile.name.split('.').pop()
        const path = `${userId}/logo.${ext}`
        const { error: uploadError } = await supabase.storage.from('farm-assets').upload(path, logoFile, { upsert: true })
        if (!uploadError) {
          const { data } = supabase.storage.from('farm-assets').getPublicUrl(path)
          logoUrl = data.publicUrl
        }
      }

      const { error: updateError } = await supabase.from('farms').update({
        name: farmName,
        logo_url: logoUrl,
        color_theme: JSON.stringify({ header: headerColor, bg: bgColor, text: textColor, accent: accentColor }),
      }).eq('id', farm.id)

      if (updateError) throw updateError
      setMessage('✅ Storefront updated!')
    } catch (err: any) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = { width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px', fontFamily: 'Georgia, serif', fontSize: '0.95rem', boxSizing: 'border-box' as const, marginTop: '0.3rem' }
  const labelStyle = { display: 'block' as const, color: '#444', fontSize: '0.85rem', fontWeight: 'bold' as const, marginBottom: '0.1rem' }

  if (loading) return <main style={{ padding: 40, fontFamily: 'Georgia, serif' }}><p>Loading...</p></main>

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, fontFamily: 'Georgia, serif', display: 'flex' }}>

      {/* LEFT: Edit Form */}
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', maxWidth: '560px', backgroundColor: 'white', boxShadow: '2px 0 8px rgba(0,0,0,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: '#8B1A1A', cursor: 'pointer', fontSize: '0.9rem' }}>← Back to Dashboard</button>
        </div>
        <h1 style={{ color: '#8B1A1A', fontSize: '1.6rem', marginBottom: '0.25rem' }}>🎨 Edit My Storefront</h1>
        <p style={{ color: '#666', marginBottom: '2rem', fontSize: '0.9rem' }}>Changes preview live on the right.</p>

        {/* Farm Name */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={labelStyle}>Farm Name</label>
          <input style={inputStyle} value={farmName} onChange={e => setFarmName(e.target.value)} />
        </div>

        {/* Colors */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#8B1A1A', marginBottom: '0.75rem' }}>Colors</h3>
          {[
            { label: 'Header Color', value: headerColor, set: setHeaderColor },
            { label: 'Background Color', value: bgColor, set: setBgColor },
            { label: 'Text Color', value: textColor, set: setTextColor },
            { label: 'Accent Color', value: accentColor, set: setAccentColor },
          ].map(({ label, value, set }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
              <label style={{ ...labelStyle, flex: 1, marginBottom: 0 }}>{label}</label>
              <input type="color" value={value} onChange={e => set(e.target.value)}
                style={{ width: '48px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: '4px' }} />
              <span style={{ fontSize: '0.8rem', color: '#888', width: '70px' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Logo */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#8B1A1A', marginBottom: '0.75rem' }}>Logo</h3>
          <div style={{ border: '2px dashed #ccc', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', backgroundColor: '#fafafa' }}>
            {logoPreview ? (
              <div>
                <img src={logoPreview} alt="Logo" style={{ maxHeight: '100px', maxWidth: '100%', borderRadius: '8px', marginBottom: '0.75rem' }} />
                <br />
                <button onClick={() => { setLogoFile(null); setLogoPreview(null) }}
                  style={{ background: 'none', border: '1px solid #ccc', padding: '0.3rem 0.75rem', borderRadius: '4px', cursor: 'pointer', color: '#666', fontSize: '0.8rem' }}>
                  Remove Logo
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏚️</div>
                <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '0.75rem' }}>Default barn — upload yours to replace</p>
                <label style={{ backgroundColor: '#8B1A1A', color: 'white', padding: '0.5rem 1.25rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  Upload Logo
                  <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Website */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#8B1A1A', marginBottom: '0.75rem' }}>Website</h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginBottom: '0.75rem' }}>
            <input type="checkbox" checked={hasWebsite} onChange={e => setHasWebsite(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#8B1A1A' }} />
            <span style={{ fontSize: '0.9rem' }}>I have an existing website</span>
          </label>
          {hasWebsite && <input style={inputStyle} value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://myfarm.com" />}

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginTop: '0.75rem' }}>
            <input type="checkbox" checked={wantsCustomSite} onChange={e => setWantsCustomSite(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#8B1A1A' }} />
            <span style={{ fontSize: '0.9rem' }}>Order a custom website from My Farm Express</span>
          </label>
          {wantsCustomSite && (
            <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: '#fff8e1', borderRadius: '6px', fontSize: '0.8rem', color: '#7a5c00' }}>
              🎉 We'll reach out to discuss your custom site!
            </div>
          )}
        </div>

        {error && <p style={{ color: 'red', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</p>}
        {message && <p style={{ color: 'green', marginBottom: '1rem', fontSize: '0.85rem' }}>{message}</p>}

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={handleSave} disabled={saving}
            style={{ backgroundColor: '#5D8A3C', color: 'white', border: 'none', padding: '0.75rem 2rem', borderRadius: '4px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '1rem', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : '💾 Save Changes'}
          </button>
          <button onClick={() => router.push('/farm/' + farm.slug)}
            style={{ backgroundColor: '#8B1A1A', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}>
            View Live Store →
          </button>
        </div>
      </div>

      {/* RIGHT: Live Preview */}
      <div style={{ flex: 1, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', backgroundColor: bgColor }}>
        <div style={{ backgroundColor: headerColor, padding: '1.5rem', textAlign: 'center' }}>
          {logoPreview
            ? <img src={logoPreview} alt="logo" style={{ height: '56px', borderRadius: '6px', marginBottom: '0.5rem' }} />
            : <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏚️</div>
          }
          <div style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 'bold' }}>{farmName || 'Your Farm Name'}</div>
          <div style={{ color: accentColor, fontSize: '0.7rem', letterSpacing: '0.15em', marginTop: '0.25rem' }}>FRESH FROM THE FARM</div>
        </div>

        <div style={{ padding: '1.5rem' }}>
          <h2 style={{ color: textColor, borderBottom: `2px solid ${accentColor}`, paddingBottom: '0.5rem', marginBottom: '1rem' }}>Our Products</h2>
          <div style={{ border: '2px dashed #ddd', borderRadius: '8px', padding: '2rem', textAlign: 'center', color: '#aaa' }}>
            Your products will appear here
          </div>
        </div>

        <div style={{ backgroundColor: headerColor, color: '#fff', textAlign: 'center', padding: '1rem', fontSize: '0.8rem', marginTop: '2rem' }}>
          {farmName || 'Your Farm'} — Powered by <strong>My Farm Express</strong>
        </div>
      </div>
    </div>
  )
}