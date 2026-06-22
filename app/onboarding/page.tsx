'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  // Step 1 - Basics
  const [farmName, setFarmName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [slug, setSlug] = useState('')

  // Step 2 - Colors
  const [headerColor, setHeaderColor] = useState('#8B1A1A')
  const [bgColor, setBgColor] = useState('#FFFDF5')
  const [textColor, setTextColor] = useState('#2C1810')
  const [accentColor, setAccentColor] = useState('#5D8A3C')

  // Step 3 - Logo
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  // Step 4 - Products
  const [products, setProducts] = useState([{ name: '', price: '', description: '' }])

  // Step 5 - Website
  const [hasWebsite, setHasWebsite] = useState(false)
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [wantsCustomSite, setWantsCustomSite] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/auth/login'); return }
      const { data: existingFarm } = await supabase.from('farms').select('id').eq('owner_id', session.user.id).maybeSingle()
      if (existingFarm) { router.push('/dashboard'); return }
      setUserId(session.user.id)
    })
  }, [])

  const handleFarmNameChange = (val: string) => {
    setFarmName(val)
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const addProduct = () => {
    if (products.length < 5) setProducts([...products, { name: '', price: '', description: '' }])
  }

  const updateProduct = (index: number, field: string, value: string) => {
    const updated = [...products]
    updated[index] = { ...updated[index], [field]: value }
    setProducts(updated)
  }

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index))
  }

  const handlePublish = async () => {
    setLoading(true)
    setError('')

    try {
      let logoUrl = null
      if (logoFile && userId) {
        const ext = logoFile.name.split('.').pop()
        const path = `${userId}/logo.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('farm-assets')
          .upload(path, logoFile, { upsert: true })
        if (!uploadError) {
          const { data } = supabase.storage.from('farm-assets').getPublicUrl(path)
          logoUrl = data.publicUrl
        }
      }

      const { data: farm, error: farmError } = await supabase
        .from('farms')
        .insert({
          owner_id: userId,
          name: farmName,
          slug,
          logo_url: logoUrl,
          color_theme: JSON.stringify({ header: headerColor, bg: bgColor, text: textColor, accent: accentColor }),
          cash_enabled: false,
          subscription_active: false,
        })
        .select()
        .single()

      if (farmError) throw farmError

      const validProducts = products.filter(p => p.name.trim() && p.price)
      if (validProducts.length > 0) {
        await supabase.from('products').insert(
          validProducts.map(p => ({
            farm_id: farm.id,
            name: p.name,
            price: parseFloat(p.price),
            description: p.description,
            quantity: 99,
            is_shippable: false,
            needs_cold_storage: false,
            active: true,
          }))
        )
      }

      await supabase.from('profiles').update({ role: ['farmer'] }).eq('id', userId)

      router.push(`/farm/${slug}`)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '0.6rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontFamily: 'Georgia, serif',
    fontSize: '0.95rem',
    boxSizing: 'border-box' as const,
    marginTop: '0.3rem',
  }

  const labelStyle = {
    display: 'block' as const,
    color: '#444',
    fontSize: '0.85rem',
    fontWeight: 'bold' as const,
    marginBottom: '0.1rem',
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, fontFamily: 'Georgia, serif', display: 'flex', gap: 0 }}>

      {/* LEFT: Form Panel */}
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', maxWidth: '580px' }}>
        <h1 style={{ color: '#8B1A1A', fontSize: '1.8rem', marginBottom: '0.25rem' }}>Welcome to My Farm Express 🌾</h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>Let's set up your farm store. Only the basics are required — everything else is optional.</p>

        {/* Progress Bar */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          {['Basics', 'Colors', 'Logo', 'Products', 'Website'].map((label, i) => (
            <div key={i} onClick={() => i + 1 < step && setStep(i + 1)}
              style={{ flex: 1, textAlign: 'center', padding: '0.4rem', borderRadius: '4px', fontSize: '0.75rem',
                cursor: i + 1 < step ? 'pointer' : 'default',
                backgroundColor: step === i + 1 ? '#8B1A1A' : step > i + 1 ? '#5D8A3C' : '#eee',
                color: step >= i + 1 ? 'white' : '#888' }}>
              {step > i + 1 ? '✓' : label}
            </div>
          ))}
        </div>

        {/* STEP 1: Basics */}
        {step === 1 && (
          <div>
            <h2 style={{ color: '#8B1A1A', marginBottom: '1rem' }}>Step 1: The Basics</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Your Name *</label>
              <input style={inputStyle} value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Jane Smith" />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Farm Name *</label>
              <input style={inputStyle} value={farmName} onChange={e => handleFarmNameChange(e.target.value)} placeholder="Sunny Acres Farm" />
            </div>
            {farmName && (
              <div style={{ backgroundColor: '#f0f0f0', padding: '0.6rem', borderRadius: '4px', fontSize: '0.8rem', color: '#555', marginBottom: '1rem' }}>
                Your store URL: <strong>myfarmexpress.com/farm/{slug}</strong>
              </div>
            )}
            {error && <p style={{ color: 'red', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{error}</p>}
            <button onClick={() => { if (!farmName || !ownerName) { setError('Please fill in your name and farm name.'); return; } setError(''); setStep(2) }}
              style={{ backgroundColor: '#8B1A1A', color: 'white', border: 'none', padding: '0.7rem 2rem', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}>
              Next →
            </button>
          </div>
        )}

        {/* STEP 2: Colors */}
        {step === 2 && (
          <div>
            <h2 style={{ color: '#8B1A1A', marginBottom: '0.5rem' }}>Step 2: Colors <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: 'normal' }}>(optional)</span></h2>
            <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Customize your store's look. The preview updates live on the right.</p>
            {[
              { label: 'Header Color', value: headerColor, set: setHeaderColor },
              { label: 'Background Color', value: bgColor, set: setBgColor },
              { label: 'Text Color', value: textColor, set: setTextColor },
              { label: 'Accent Color', value: accentColor, set: setAccentColor },
            ].map(({ label, value, set }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <label style={{ ...labelStyle, flex: 1, marginBottom: 0 }}>{label}</label>
                <input type="color" value={value} onChange={e => set(e.target.value)}
                  style={{ width: '48px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: '4px' }} />
                <span style={{ fontSize: '0.8rem', color: '#888', width: '70px' }}>{value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button onClick={() => setStep(1)} style={{ backgroundColor: '#eee', color: '#444', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '4px', cursor: 'pointer' }}>← Back</button>
              <button onClick={() => setStep(3)} style={{ backgroundColor: '#8B1A1A', color: 'white', border: 'none', padding: '0.7rem 2rem', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}>Next →</button>
            </div>
          </div>
        )}

        {/* STEP 3: Logo */}
        {step === 3 && (
          <div>
            <h2 style={{ color: '#8B1A1A', marginBottom: '0.5rem' }}>Step 3: Logo <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: 'normal' }}>(optional)</span></h2>
            <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Upload your farm logo. If you skip this, a default barn image will be used.</p>

            <div style={{ border: '2px dashed #ccc', borderRadius: '8px', padding: '2rem', textAlign: 'center', backgroundColor: '#fafafa' }}>
              {logoPreview ? (
                <div>
                  <img src={logoPreview} alt="Logo preview" style={{ maxHeight: '120px', maxWidth: '100%', borderRadius: '8px', marginBottom: '1rem' }} />
                  <br />
                  <button onClick={() => { setLogoFile(null); setLogoPreview(null) }}
                    style={{ background: 'none', border: '1px solid #ccc', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer', color: '#666', fontSize: '0.85rem' }}>
                    Remove & Use Default
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏚️</div>
                  <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>Default barn logo — upload yours below to replace it</p>
                  <label style={{ backgroundColor: '#8B1A1A', color: 'white', padding: '0.6rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}>
                    Upload Logo
                    <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button onClick={() => setStep(2)} style={{ backgroundColor: '#eee', color: '#444', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '4px', cursor: 'pointer' }}>← Back</button>
              <button onClick={() => setStep(4)} style={{ backgroundColor: '#8B1A1A', color: 'white', border: 'none', padding: '0.7rem 2rem', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}>Next →</button>
            </div>
          </div>
        )}

        {/* STEP 4: Products */}
        {step === 4 && (
          <div>
            <h2 style={{ color: '#8B1A1A', marginBottom: '0.5rem' }}>Step 4: Products <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: 'normal' }}>(optional — add up to 5)</span></h2>
            <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '1rem' }}>You can always add more from your dashboard later.</p>

            {products.map((p, i) => (
              <div key={i} style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '1rem', marginBottom: '1rem', backgroundColor: '#fafafa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <strong style={{ color: '#444' }}>Product {i + 1}</strong>
                  {products.length > 1 && (
                    <button onClick={() => removeProduct(i)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                  )}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <label style={labelStyle}>Product Name</label>
                  <input style={inputStyle} value={p.name} onChange={e => updateProduct(i, 'name', e.target.value)} placeholder="e.g. Fresh Eggs" />
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <label style={labelStyle}>Price ($)</label>
                  <input style={inputStyle} type="number" step="0.01" value={p.price} onChange={e => updateProduct(i, 'price', e.target.value)} placeholder="4.99" />
                </div>
                <div>
                  <label style={labelStyle}>Description</label>
                  <input style={inputStyle} value={p.description} onChange={e => updateProduct(i, 'description', e.target.value)} placeholder="e.g. One dozen, free range" />
                </div>
              </div>
            ))}

            {products.length < 5 && (
              <button onClick={addProduct} style={{ backgroundColor: '#5D8A3C', color: 'white', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '4px', cursor: 'pointer', marginBottom: '1rem' }}>
                + Add Another Product
              </button>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button onClick={() => setStep(3)} style={{ backgroundColor: '#eee', color: '#444', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '4px', cursor: 'pointer' }}>← Back</button>
              <button onClick={() => setStep(5)} style={{ backgroundColor: '#8B1A1A', color: 'white', border: 'none', padding: '0.7rem 2rem', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}>Next →</button>
            </div>
          </div>
        )}

        {/* STEP 5: Website */}
        {step === 5 && (
          <div>
            <h2 style={{ color: '#8B1A1A', marginBottom: '0.5rem' }}>Step 5: Your Website <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: 'normal' }}>(optional)</span></h2>
            <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Tell us about your existing web presence, or let us build something for you.</p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={hasWebsite} onChange={e => setHasWebsite(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#8B1A1A' }} />
                <span style={{ fontSize: '0.95rem' }}>I already have a website</span>
              </label>
              {hasWebsite && (
                <input style={{ ...inputStyle, marginTop: '0.75rem' }} value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://myfarm.com" />
              )}
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={wantsCustomSite} onChange={e => setWantsCustomSite(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#8B1A1A' }} />
                <span style={{ fontSize: '0.95rem' }}>I'd like to order a custom website from My Farm Express</span>
              </label>
              {wantsCustomSite && (
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#fff8e1', borderRadius: '6px', fontSize: '0.85rem', color: '#7a5c00' }}>
                  🎉 Great! We'll reach out to you at your signup email to discuss your custom site.
                </div>
              )}
            </div>

            {error && <p style={{ color: 'red', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setStep(4)} style={{ backgroundColor: '#eee', color: '#444', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '4px', cursor: 'pointer' }}>← Back</button>
              <button onClick={handlePublish} disabled={loading}
                style={{ backgroundColor: '#5D8A3C', color: 'white', border: 'none', padding: '0.7rem 2rem', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Publishing...' : '🚀 Publish My Farm!'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: Live Preview */}
      <div style={{ flex: 1, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', borderLeft: '1px solid #ddd', backgroundColor: bgColor }}>
        <div style={{ backgroundColor: headerColor, padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {logoPreview
            ? <img src={logoPreview} alt="logo" style={{ height: '48px', width: '48px', borderRadius: '4px', objectFit: 'cover' }} />
            : <span style={{ fontSize: '2.5rem' }}>🏚️</span>
          }
          <div>
            <div style={{ color: '#fff', fontFamily: 'Georgia, serif', fontSize: '1.2rem', fontWeight: 'bold' }}>
              {farmName || 'Your Farm Name'}
            </div>
            <div style={{ color: accentColor, fontSize: '0.7rem', letterSpacing: '0.1em' }}>FRESH FROM THE FARM</div>
          </div>
        </div>

        <div style={{ padding: '1.5rem' }}>
          <h2 style={{ color: textColor, fontFamily: 'Georgia, serif', marginBottom: '0.5rem' }}>
            Welcome to {farmName || 'Your Farm'}!
          </h2>
          <p style={{ color: textColor, opacity: 0.7, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {ownerName ? `Owned by ${ownerName}` : 'Your farm tagline goes here'}
          </p>

          {products.filter(p => p.name).length > 0 ? (
            <div>
              <h3 style={{ color: textColor, marginBottom: '1rem' }}>Products</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {products.filter(p => p.name).map((p, i) => (
                  <div key={i} style={{ border: `1px solid ${accentColor}`, borderRadius: '8px', padding: '0.75rem', backgroundColor: 'white' }}>
                    <div style={{ fontWeight: 'bold', color: textColor, fontSize: '0.9rem' }}>{p.name}</div>
                    {p.description && <div style={{ fontSize: '0.75rem', color: '#888', margin: '0.25rem 0' }}>{p.description}</div>}
                    {p.price && <div style={{ color: accentColor, fontWeight: 'bold' }}>${parseFloat(p.price).toFixed(2)}</div>}
                    <button style={{ marginTop: '0.5rem', width: '100%', padding: '0.4rem', backgroundColor: headerColor, color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}>
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ border: '2px dashed #ddd', borderRadius: '8px', padding: '2rem', textAlign: 'center', color: '#aaa' }}>
              Your products will appear here
            </div>
          )}
        </div>
      </div>
    </div>
  )
}