'use client'

import { useState, useEffect } from 'react'

type Version = {
  id: number
  note: string
}

export default function RecalcPage() {
  const [versions, setVersions] = useState<Version[]>([])
  const [selectedVersion, setSelectedVersion] = useState<string>('')
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setVersions(data)
          if (data.length > 0) setSelectedVersion(data[0].id.toString())
        }
      })
  }, [])

  const handleRecalculate = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/recalc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ versionId: parseInt(selectedVersion) })
    })
    setLoading(false)
    if (res.ok) {
      setResults(await res.json())
    } else {
      alert('Failed to recalculate')
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Recalculation Tool</h1>
      
      <div className="bg-white p-6 rounded shadow mb-8 max-w-4xl">
        <h2 className="text-xl font-semibold mb-4">Run Recalculation (Dry Run)</h2>
        <p className="mb-4 text-gray-600">
          Select a version to re-run raw quiz answers against. This will NOT overwrite DB values.
        </p>
        
        <div className="flex gap-4 items-center mb-4">
          <select 
            value={selectedVersion} 
            onChange={e => setSelectedVersion(e.target.value)}
            className="border p-2 rounded"
          >
            {versions.map(v => (
              <option key={v.id} value={v.id}>v{v.id} - {v.note}</option>
            ))}
          </select>
          <button 
            onClick={handleRecalculate}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Running...' : 'Run Compute'}
          </button>
        </div>

        {results && (
          <div className="mt-8 p-4 bg-gray-50 border rounded">
            <h3 className="font-bold mb-4">Comparison Results (Label Distribution)</h3>
            <div className="flex gap-8">
              <div className="flex-1">
                <p className="text-gray-500 font-bold mb-2">Previous</p>
                <ul>
                  {Object.entries(results.oldDistribution || {}).map(([k, v]) => (
                    <li key={k} className="flex justify-between border-b py-1">
                      <span>{k}</span>
                      <span className="font-mono">{v as React.ReactNode}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1">
                <p className="text-green-600 font-bold mb-2">New</p>
                <ul>
                  {Object.entries(results.newDistribution || {}).map(([k, v]) => (
                    <li key={k} className="flex justify-between border-b py-1">
                      <span>{k}</span>
                      <span className="font-mono">{v as React.ReactNode}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
