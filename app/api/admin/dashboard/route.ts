import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabase as adminSupabase } from '@/lib/supabase'
import { mean, stdDev, median, cronbachAlpha, pearsonCorrelation, itemTotalCorrelation } from '@/lib/stats'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json({ error: authError.message }, { status: 401 })
    }

    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()) || []
    if (!user || !user.email || !adminEmails.includes(user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const version = url.searchParams.get('version')
    const country = url.searchParams.get('country')
    const dateFrom = url.searchParams.get('dateFrom')
    const dateTo = url.searchParams.get('dateTo')
    const magicExperience = url.searchParams.get('magicExperience')
    const excludeLowQuality = url.searchParams.get('excludeLowQuality') === 'true'

    let responses: any[] = []
    let page = 0
    while (true) {
      let query = adminSupabase.from('responses').select('*').range(page * 1000, (page + 1) * 1000 - 1)
      if (version) query = query.eq('version', version)
      if (country) query = query.eq('country', country)
      if (dateFrom) query = query.gte('created_at', dateFrom)
      if (dateTo) query = query.lte('created_at', dateTo)
      if (magicExperience) query = query.eq('magic_experience', magicExperience)
      
      const { data, error } = await query
      if (error) break
      if (!data || data.length === 0) break
      
      // Filter in memory for excludeLowQuality
      let pageData = data
      if (excludeLowQuality) {
        pageData = pageData.filter((r: any) => !r.quality_flags || r.quality_flags.length === 0)
      }
      responses = responses.concat(pageData)
      if (data.length < 1000) break
      page++
    }

    // 1. Data Quality
    let completionTimes: number[] = []
    let flaggedCount = 0
    for (const r of responses) {
      if (r.quality_flags && r.quality_flags.length > 0) flaggedCount++
      if (r.section_times && typeof r.section_times === 'object') {
        const sum = Object.values(r.section_times).reduce((a: any, b: any) => a + (typeof b === 'number' ? b : 0), 0) as number
        if (sum > 0) completionTimes.push(sum)
      }
    }
    const medianTime = median(completionTimes) || 0

    const completed = responses.filter(r => r.status === 'completed')

    // 2. Results Overview
    const cMap: Record<string, string> = { W: 'White', U: 'Blue', B: 'Black', R: 'Red', G: 'Green' }
    const colorCounts: Record<string, number> = { White: 0, Blue: 0, Black: 0, Red: 0, Green: 0 }
    let totalInclusions = 0
    
    const sizeDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    const resultNames: Record<string, number> = {}
    
    const leanCounts: Record<string, number> = { White: 0, Blue: 0, Black: 0, Red: 0, Green: 0 }
    let totalLeans = 0
    
    const confidenceCounts: Record<string, number> = {}
    const finalPercentages: Record<string, number[]> = { White: [], Blue: [], Black: [], Red: [], Green: [] }

    for (const r of completed) {
      if (r.included && Array.isArray(r.included)) {
        r.included.forEach((c: string) => {
          if (cMap[c]) colorCounts[cMap[c]]++
          totalInclusions++
        })
        const size = r.included.length
        if (size >= 1 && size <= 5) sizeDistribution[size]++
      }
      
      if (r.result_name) {
        resultNames[r.result_name] = (resultNames[r.result_name] || 0) + 1
      }
      
      if (r.leans && Array.isArray(r.leans)) {
        r.leans.forEach((c: string) => {
          if (cMap[c]) leanCounts[cMap[c]]++
          totalLeans++
        })
      }
      
      if (r.confidence) {
        confidenceCounts[r.confidence] = (confidenceCounts[r.confidence] || 0) + 1
      }
      
      if (r.final_percentages) {
        for (const [k, v] of Object.entries(r.final_percentages)) {
          if (finalPercentages[cMap[k]]) {
            finalPercentages[cMap[k]].push(v as number)
          }
        }
      }
    }
    
    const top10Results = Object.entries(resultNames).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count }))
    const avgFinalPercentages = Object.fromEntries(Object.entries(finalPercentages).map(([k, arr]) => [k, mean(arr) || 0]))

    // 3. Calibration
    const rawValues: Record<string, number[]> = {}
    const rawBigFive: Record<string, number[]> = {}
    const rawEnneagram: Record<string, number[]> = {}
    
    for (const r of completed) {
      if (r.raw) {
        if (r.raw.values) {
          for (const [k, v] of Object.entries(r.raw.values)) {
            if (!rawValues[k]) rawValues[k] = []
            rawValues[k].push(v as number)
          }
        }
        if (r.raw.bigfive) {
          for (const [k, v] of Object.entries(r.raw.bigfive)) {
            if (!rawBigFive[k]) rawBigFive[k] = []
            rawBigFive[k].push(v as number)
          }
        }
        if (r.raw.enneagram) {
          for (const [k, v] of Object.entries(r.raw.enneagram)) {
            if (!rawEnneagram[k]) rawEnneagram[k] = []
            rawEnneagram[k].push(v as number)
          }
        }
      }
    }
    
    const calibration: any = { values: {}, bigFive: {}, enneagram: {} }
    for (const [k, arr] of Object.entries(rawValues)) {
      calibration.values[k] = { mean: mean(arr), sd: stdDev(arr) }
    }
    for (const [k, arr] of Object.entries(rawBigFive)) {
      calibration.bigFive[k] = { mean: mean(arr), sd: stdDev(arr) }
    }
    for (const [k, arr] of Object.entries(rawEnneagram)) {
      calibration.enneagram[k] = { mean: mean(arr), sd: stdDev(arr) }
    }

    // 4. Question Quality
    // For every rating item, compute mean, sd, and distribution
    // This requires extracting answers
    const itemStats: Record<string, number[]> = {}
    for (const r of completed) {
      if (r.answers) {
        for (const [qId, ans] of Object.entries(r.answers)) {
          if (typeof ans === 'number') {
            if (!itemStats[qId]) itemStats[qId] = []
            itemStats[qId].push(ans)
          }
        }
      }
    }
    const questionQuality = Object.fromEntries(Object.entries(itemStats).map(([qId, arr]) => {
      const dist: Record<number, number> = {}
      arr.forEach(v => dist[v] = (dist[v] || 0) + 1)
      return [qId, { mean: mean(arr), sd: stdDev(arr), distribution: dist }]
    }))

    // Dilemma choice rates
    const dilemmaRates: Record<string, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 }
    let dilemmaTotal = 0
    for (const r of completed) {
      if (r.dilemma) {
        for (const k of ['W', 'U', 'B', 'R', 'G']) {
          dilemmaRates[k] += r.dilemma[k] || 0
        }
        dilemmaTotal++
      }
    }
    const dilemmaStats = Object.fromEntries(Object.entries(dilemmaRates).map(([k, v]) => [k, dilemmaTotal > 0 ? v / dilemmaTotal : 0]))

    // 5. Agreement (Correlations)
    const correlations: any = {
      values: {},
      bigFive: {},
      enneagram: {},
      dilemma: {}
    }
    // We would need Z-scores per color. To simplify, we just compute Pearson correlation between raw components if they exist for each color
    for (const color of ['W', 'U', 'B', 'R', 'G']) {
      const valuesColor = rawValues[color] || []
      const bfColor = rawBigFive[color] || []
      if (valuesColor.length === bfColor.length && valuesColor.length > 0) {
        correlations.values[color] = pearsonCorrelation(valuesColor, bfColor)
      }
    }

    // 6. Accuracy
    const { data: feedbackData } = await adminSupabase.from('feedback').select('accuracy, self_colors')
    let avgAccuracy = 0
    let feedbackCount = 0
    if (feedbackData) {
      let sum = 0
      for (const f of feedbackData) {
        if (f.accuracy) {
          sum += f.accuracy
          feedbackCount++
        }
      }
      avgAccuracy = feedbackCount > 0 ? sum / feedbackCount : 0
    }

    return NextResponse.json({
      sampleSize: responses.length,
      completedSize: completed.length,
      dataQuality: {
        medianTime,
        flaggedCount
      },
      resultsOverview: {
        colorCounts,
        totalInclusions,
        sizeDistribution,
        top10Results,
        leanCounts,
        totalLeans,
        confidenceCounts,
        avgFinalPercentages
      },
      calibration,
      questionQuality: {
        items: questionQuality,
        dilemma: dilemmaStats
      },
      agreement: correlations,
      accuracy: {
        avgAccuracy,
        feedbackCount
      }
    });
  } catch (err: any) {
    console.error("Dashboard API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
