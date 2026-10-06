import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabase as adminSupabase } from '@/lib/supabase'
import { explain } from '@/lib/explain'
import fs from 'fs'
import path from 'path'
import { SETTINGS } from '@/lib/settings'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()) || []
  if (!user || !user.email || !adminEmails.includes(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { versionId } = await request.json()
  if (!versionId) return NextResponse.json({ error: 'Missing versionId' }, { status: 400 })

  const { data: vData, error: vError } = await adminSupabase.from('settings_versions').select('*').eq('id', versionId).single()
  if (vError) return NextResponse.json({ error: vError.message }, { status: 500 })

  Object.assign(SETTINGS, vData.settings)
  
  const rawData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'quiz_content.json'), 'utf-8'))
  const getKeys = (v: 'quick' | 'long') => {
    const vq = rawData.sections.values[v].map((x: any) => x.id)
    const pq = rawData.sections.personality[v].map((x: any) => x.id)
    const mq = rawData.sections.motivations.items.map((x: any) => x.id)
    const dq = rawData.sections.dilemmas.groups
    
    const big5_keys = rawData.sections.personality[v].map((x: any) => [x.trait, x.reversed]) as [string, boolean][]
    const enn_keys = rawData.sections.motivations.items.map((x: any) => [x.type, x.side]) as [number, "H" | "U"][]
    
    return { vq, pq, mq, dq, big5_keys, enn_keys }
  }
  
  let allResponses: any[] = []
  let page = 0
  while (true) {
    const { data, error } = await adminSupabase.from('responses')
      .select('id, version, answers, dilemma_display_order, label')
      .eq('status', 'completed')
      .range(page * 1000, (page + 1) * 1000 - 1)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data || data.length === 0) break
    allResponses = allResponses.concat(data)
    if (data.length < 1000) break
    page++
  }

  const counts: Record<string, number> = {}
  const oldLabels: Record<string, number> = {}

  for (const r of allResponses) {
    if (!r.answers || !r.version) continue
    const v = r.version as 'quick' | 'long'
    const keys = getKeys(v)
    
    // reconstruct answers array
    const values_ans = keys.vq.map((id: string) => r.answers[id] || 3)
    const big5_ans = keys.pq.map((id: string) => r.answers[id] || 3)
    const enn_ans = keys.mq.map((id: string) => r.answers[id] || 3)
    
    // reconstruct dilemmas
    const dilemma_choices: any[] = []
    const order = r.dilemma_display_order || []
    
    for (let i = 0; i < keys.dq.length; i++) {
      const g = keys.dq[i]
      const aid = `d${i + 1}`
      if (r.answers[aid]) {
        // Find which one was chosen
        const chosenStatement = g.statements.find((s: any) => s.id === r.answers[aid])
        const choiceIdx = g.statements.indexOf(chosenStatement)
        if (choiceIdx !== -1) {
            let colors = order[i] || []
            // If they picked choiceIdx, that's the "most"
            // Since it's pairwise, the other is 1-choiceIdx
            if (colors.length >= 2) {
              const most = colors[choiceIdx]
              const least = colors[1 - choiceIdx]
              dilemma_choices.push([most, least])
            }
        }
      }
    }
    
    try {
      const res = explain(v, values_ans, big5_ans, keys.big5_keys, enn_ans, keys.enn_keys, dilemma_choices, vData.norms.us_norms, vData.typical_values[v])
      
      const newLabel = res.r.label
      counts[newLabel] = (counts[newLabel] || 0) + 1
      oldLabels[r.label || 'unknown'] = (oldLabels[r.label || 'unknown'] || 0) + 1
    } catch (e) {
      console.error(e)
    }
  }

  return NextResponse.json({
    newDistribution: counts,
    oldDistribution: oldLabels
  })
}
