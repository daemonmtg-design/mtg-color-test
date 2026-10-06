import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabase as adminSupabase } from '@/lib/supabase'

function flattenObj(obj: any, parent: string = '', res: Record<string, any> = {}) {
  for (let key in obj) {
    let propName = parent ? parent + '.' + key : key
    if (typeof obj[key] == 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      flattenObj(obj[key], propName, res)
    } else {
      res[propName] = obj[key]
    }
  }
  return res
}

export async function GET(request: Request, { params }: { params: { type: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()) || []
  if (!user || !user.email || !adminEmails.includes(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const type = params.type
  let csvContent = ''
  let filename = ''

  let table = ''
  if (type === 'responses') table = 'responses'
  else if (type === 'feedback') table = 'feedback'
  else if (type === 'friend_ratings' || type === 'friends') table = 'friend_ratings'
  else return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })

  const { data, error } = await adminSupabase.from(table).select('*').limit(10000)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (data.length === 0) {
    csvContent = 'id\n'
  } else {
    const flattenedData = data.map(r => flattenObj(r))
    const keys = new Set<string>()
    flattenedData.forEach(r => Object.keys(r).forEach(k => keys.add(k)))
    const cols = Array.from(keys)
    csvContent = cols.join(',') + '\n' + flattenedData.map(r => cols.map(c => JSON.stringify(r[c] ?? '')).join(',')).join('\n')
  }
  filename = `${table}.csv`

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    }
  })
}
