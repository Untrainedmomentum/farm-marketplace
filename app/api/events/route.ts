import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { geocodeAddress } from '@/lib/geocode'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }
  const token = authHeader.replace('Bearer ', '')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const { title, address, description, eventDate, farmId } = await request.json()
  if (!title || !address) {
    return NextResponse.json({ error: 'Title and address are required' }, { status: 400 })
  }

  const coords = await geocodeAddress(address)

  const { data, error } = await supabase
    .from('events')
    .insert({
      title,
      address,
      description: description || null,
      event_date: eventDate || null,
      farm_id: farmId || null,
      created_by: user.id,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ event: data })
}
