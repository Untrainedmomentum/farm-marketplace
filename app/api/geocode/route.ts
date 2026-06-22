import { NextRequest, NextResponse } from 'next/server'
import { geocodeAddress } from '@/lib/geocode'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')
  if (!q) {
    return NextResponse.json({ error: 'Missing q' }, { status: 400 })
  }
  const coords = await geocodeAddress(q)
  if (!coords) {
    return NextResponse.json({ error: 'Location not found' }, { status: 404 })
  }
  return NextResponse.json(coords)
}
