'use client'

import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF66B2', '#FF4D4D', '#33CC33', '#FFFF66']

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null)
  
  // Filters
  const [version, setVersion] = useState('')
  const [country, setCountry] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [magicExperience, setMagicExperience] = useState('')
  const [excludeLowQuality, setExcludeLowQuality] = useState(false)

  const fetchData = () => {
    setData(null)
    const params = new URLSearchParams()
    if (version) params.append('version', version)
    if (country) params.append('country', country)
    if (dateFrom) params.append('dateFrom', dateFrom)
    if (dateTo) params.append('dateTo', dateTo)
    if (magicExperience) params.append('magicExperience', magicExperience)
    if (excludeLowQuality) params.append('excludeLowQuality', 'true')

    fetch(`/api/admin/dashboard?${params.toString()}`)
      .then(res => res.json())
      .then(d => {
        if (d.error) {
          setData({ _ui_error: d.error })
        } else {
          setData(d)
        }
      })
      .catch(err => setData({ _ui_error: err.message }))
  }

  useEffect(() => {
    fetchData()
  }, []) // Initial fetch

  if (data?._ui_error) return <div className="p-8 text-red-500">Error: {data._ui_error}</div>

  const colorMap: any = { 'White': '#F8F6D8', 'Blue': '#C1D8E9', 'Black': '#BAB1AB', 'Red': '#E49977', 'Green': '#A3C095' }

  const renderVal = (val: number | undefined | null) => {
    if (val === undefined || val === null || isNaN(val)) return 'No data yet'
    return val.toFixed(2)
  }

  const renderColorBars = (counts: any) => {
    if (!counts) return null;
    const chartData = Object.entries(counts).map(([name, value]) => ({ name, value, color: colorMap[name] || '#ccc' }))
    return (
      <div className="h-64">

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="space-x-4">
          <a href="/api/admin/export/all" className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded shadow-sm inline-block">Download all data (ZIP)</a>
          <a href="/api/admin/export/responses" className="text-blue-600 hover:underline text-sm font-medium">Responses (CSV)</a>
          <a href="/api/admin/export/feedback" className="text-blue-600 hover:underline text-sm font-medium">Feedback (CSV)</a>
          <a href="/api/admin/export/friend_ratings" className="text-blue-600 hover:underline text-sm font-medium">Friend Ratings (CSV)</a>
        </div>
      </div>

        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8">
              {chartData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#000" strokeWidth={1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard Overview</h1>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded shadow flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium">Version</label>
          <input type="text" className="border rounded p-1" value={version} onChange={e => setVersion(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">Country</label>
          <input type="text" className="border rounded p-1" value={country} onChange={e => setCountry(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">Date From</label>
          <input type="date" className="border rounded p-1" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">Date To</label>
          <input type="date" className="border rounded p-1" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">Magic Experience</label>
          <input type="text" className="border rounded p-1" value={magicExperience} onChange={e => setMagicExperience(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 mb-1">
          <input type="checkbox" checked={excludeLowQuality} onChange={e => setExcludeLowQuality(e.target.checked)} />
          <label className="text-sm font-medium">Exclude Low Quality</label>
        </div>
        <button className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700" onClick={fetchData}>
          Apply Filters
        </button>
      </div>

      {!data && <div>Loading...</div>}

      {data && (
        <>
          <div className="text-lg font-medium text-gray-700">Sample Size (n={data.completedSize})</div>

          {/* Data Quality */}
          <section className="bg-white p-6 rounded shadow space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">Data Quality</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><strong>Median Completion Time:</strong> {renderVal(data.dataQuality?.medianTime)}s</div>
              <div><strong>Flagged Responses:</strong> {data.dataQuality?.flaggedCount ?? 'No data yet'}</div>
            </div>
          </section>

          {/* Results Overview */}
          <section className="bg-white p-6 rounded shadow space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">Results Overview</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="font-medium mb-2">Top Colors</h3>
                {renderColorBars(data.resultsOverview?.colorCounts)}
              </div>
              <div>
                <h3 className="font-medium mb-2">Lean Rates</h3>
                {renderColorBars(data.resultsOverview?.leanCounts)}
              </div>
              <div>
                <h3 className="font-medium mb-2">Top 10 Results</h3>
                <ul className="list-disc ml-5">
                  {(data.resultsOverview?.top10Results || []).map((r: any, i: number) => (
                    <li key={i}>{r.name}: {r.count}</li>
                  ))}
                  {(!data.resultsOverview?.top10Results || data.resultsOverview.top10Results.length === 0) && 'No data yet'}
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Result Size Distribution (1-5)</h3>
                <ul className="list-disc ml-5">
                  {[1,2,3,4,5].map(size => (
                    <li key={size}>Size {size}: {data.resultsOverview?.sizeDistribution?.[size] ?? 0}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Confidence Labels</h3>
                <ul className="list-disc ml-5">
                  {Object.entries(data.resultsOverview?.confidenceCounts || {}).map(([k, v]: any) => (
                    <li key={k}>{k}: {v}</li>
                  ))}
                  {Object.keys(data.resultsOverview?.confidenceCounts || {}).length === 0 && 'No data yet'}
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Avg Final Percentages</h3>
                <ul className="list-disc ml-5">
                  {Object.entries(data.resultsOverview?.avgFinalPercentages || {}).map(([k, v]: any) => (
                    <li key={k}>{k}: {renderVal(v)}%</li>
                  ))}
                  {Object.keys(data.resultsOverview?.avgFinalPercentages || {}).length === 0 && 'No data yet'}
                </ul>
              </div>
            </div>
          </section>

          {/* Calibration */}
          <section className="bg-white p-6 rounded shadow space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">Calibration</h2>
            <p className="text-sm text-gray-500">Mean and SD of raw scores.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="font-medium mb-2">Values</h3>
                {Object.entries(data.calibration?.values || {}).map(([k, v]: any) => (
                  <div key={k}>{k}: Mean {renderVal(v.mean)}, SD {renderVal(v.sd)}</div>
                ))}
              </div>
              <div>
                <h3 className="font-medium mb-2">Big Five</h3>
                {Object.entries(data.calibration?.bigFive || {}).map(([k, v]: any) => (
                  <div key={k}>{k}: Mean {renderVal(v.mean)}, SD {renderVal(v.sd)}</div>
                ))}
              </div>
              <div>
                <h3 className="font-medium mb-2">Enneagram</h3>
                {Object.entries(data.calibration?.enneagram || {}).map(([k, v]: any) => (
                  <div key={k}>{k}: Mean {renderVal(v.mean)}, SD {renderVal(v.sd)}</div>
                ))}
              </div>
            </div>
          </section>

          {/* Question Quality */}
          <section className="bg-white p-6 rounded shadow space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">Question Quality</h2>
            
            <h3 className="font-medium mb-2">Item Stats (Mean, SD)</h3>
            <div className="max-h-64 overflow-y-auto border p-2 mb-4">
              {Object.keys(data.questionQuality?.items || {}).length === 0 ? 'No data yet' : 
                Object.entries(data.questionQuality?.items || {}).map(([qId, st]: any) => (
                  <div key={qId} className="mb-2 text-sm border-b pb-1">
                    <strong>{qId}</strong> - Mean: {renderVal(st.mean)}, SD: {renderVal(st.sd)}
                    <div className="text-xs text-gray-500">Dist: {JSON.stringify(st.distribution)}</div>
                  </div>
              ))}
            </div>

            <h3 className="font-medium mb-2">Dilemma Choice Rates</h3>
            <ul className="list-disc ml-5">
              {Object.entries(data.questionQuality?.dilemma || {}).map(([k, v]: any) => (
                <li key={k}>{k}: {renderVal(v * 100)}%</li>
              ))}
            </ul>
          </section>

          {/* Agreement */}
          <section className="bg-white p-6 rounded shadow space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">Agreement (Correlations)</h2>
            <div className="text-sm text-gray-600 mb-2">Values vs Big Five (Pearson)</div>
            <ul className="list-disc ml-5">
              {Object.entries(data.agreement?.values || {}).map(([k, v]: any) => (
                <li key={k}>{k}: {renderVal(v)}</li>
              ))}
              {Object.keys(data.agreement?.values || {}).length === 0 && 'No data yet'}
            </ul>
          </section>

          {/* Accuracy */}
          <section className="bg-white p-6 rounded shadow space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2">Accuracy</h2>
            <ul className="list-disc ml-5">
              <li><strong>Avg Accuracy (Feedback):</strong> {renderVal(data.accuracy?.avgAccuracy)} (n={data.accuracy?.feedbackCount || 0})</li>
            </ul>
          </section>

        </>
      )}
    </div>
  )
}
