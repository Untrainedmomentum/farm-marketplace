import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

  const { providerName, serviceCategory, description, serviceArea, rateInfo, contactInfo, bookingRate } = await request.json()
  if (!providerName || !serviceCategory) {
    return NextResponse.json({ error: 'Provider name and service category are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('farm_services')
    .insert({
      provider_name: providerName,
      service_category: serviceCategory,
      description: description || null,
      service_area: serviceArea || null,
      rate_info: rateInfo || null,
      contact_info: contactInfo || null,
      booking_rate: bookingRate ? parseFloat(bookingRate) : null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ service: data })
}
