import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabase as adminSupabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()) || []
  if (!user || !user.email || !adminEmails.includes(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all completed responses
  let allResponses: any[] = []
  let page = 0
  while (true) {
    const { data, error } = await adminSupabase.from('responses').select('version, raw').eq('status', 'completed').range(page * 1000, (page + 1) * 1000 - 1)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data || data.length === 0) break
    allResponses = allResponses.concat(data)
    if (data.length < 1000) break
    page++
  }

  const result: any = {
    quick: {
      values: { mean: { W: 0, U: 0, B: 0, R: 0, G: 0 }, sd: { W: 0, U: 0, B: 0, R: 0, G: 0 } },
      bigfive: { mean: { W: 0, U: 0, B: 0, R: 0, G: 0 }, sd: { W: 0, U: 0, B: 0, R: 0, G: 0 } },
      enneagram: { mean: { W: 0, U: 0, B: 0, R: 0, G: 0 }, sd: { W: 0, U: 0, B: 0, R: 0, G: 0 } },
    },
    long: {
      values: { mean: { W: 0, U: 0, B: 0, R: 0, G: 0 }, sd: { W: 0, U: 0, B: 0, R: 0, G: 0 } },
      bigfive: { mean: { W: 0, U: 0, B: 0, R: 0, G: 0 }, sd: { W: 0, U: 0, B: 0, R: 0, G: 0 } },
      enneagram: { mean: { W: 0, U: 0, B: 0, R: 0, G: 0 }, sd: { W: 0, U: 0, B: 0, R: 0, G: 0 } },
    }
  }

  const counts = { quick: 0, long: 0 }
  const colors = ['W', 'U', 'B', 'R', 'G']
  const categories = ['values', 'bigfive', 'enneagram']

  // Means
  for (const r of allResponses) {
    const v = r.version as 'quick' | 'long'
    if (!v || !result[v]) continue
    if (!r.raw) continue
    counts[v]++
    for (const cat of categories) {
      if (r.raw[cat]) {
        for (const c of colors) {
          result[v][cat].mean[c] += r.raw[cat][c] || 0
        }
      }
    }
  }

  for (const v of ['quick', 'long'] as const) {
    if (counts[v] > 0) {
      for (const cat of categories) {
        for (const c of colors) {
          result[v][cat].mean[c] /= counts[v]
        }
      }
    }
  }

  // Standard Deviation
  for (const r of allResponses) {
    const v = r.version as 'quick' | 'long'
    if (!v || !result[v]) continue
    if (!r.raw) continue
    for (const cat of categories) {
      if (r.raw[cat]) {
        for (const c of colors) {
          const diff = (r.raw[cat][c] || 0) - result[v][cat].mean[c]
          result[v][cat].sd[c] += diff * diff
        }
      }
    }
  }

  for (const v of ['quick', 'long'] as const) {
    if (counts[v] > 0) {
      for (const cat of categories) {
        for (const c of colors) {
          result[v][cat].sd[c] = Math.sqrt(result[v][cat].sd[c] / counts[v])
        }
      }
    }
  }

  return NextResponse.json(result)
}
