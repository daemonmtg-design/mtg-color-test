import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabase as adminSupabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()) || []
  if (!user || !user.email || !adminEmails.includes(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await adminSupabase.from('settings_versions').select('id, created_at, note, active, settings, typical_values, norms').order('id', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()) || []
  if (!user || !user.email || !adminEmails.includes(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { note, settings, typical_values, norms } = body

  const { data, error } = await adminSupabase.from('settings_versions').insert([{
    note,
    settings,
    typical_values,
    norms,
    active: false
  }]).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()) || []
  if (!user || !user.email || !adminEmails.includes(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Deactivate all
  await adminSupabase.from('settings_versions').update({ active: false }).neq('id', 0)
  // Activate selected
  const { data, error } = await adminSupabase.from('settings_versions').update({ active: true }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
