export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'my-farm-express (farm-marketplace app)' },
  })
  if (!res.ok) return null
  const results = await res.json()
  if (!results?.length) return null
  return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) }
}
