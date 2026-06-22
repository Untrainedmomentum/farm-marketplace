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

  const { name, address, datesText, hoursText, website, contactInfo, notes } = await request.json()
  if (!name || !address) {
    return NextResponse.json({ error: 'Name and address are required' }, { status: 400 })
  }

  const coords = await geocodeAddress(address)

  const { data, error } = await supabase
    .from('farm_stands')
    .insert({
      name,
      address,
      dates_text: datesText || null,
      hours_text: hoursText || null,
      website: website || null,
      contact_info: contactInfo || null,
      notes: notes || null,
      created_by: user.id,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ stand: data })
}
