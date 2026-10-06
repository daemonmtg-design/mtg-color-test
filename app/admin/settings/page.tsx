'use client'

import { useState, useEffect } from 'react'

type Version = {
  id: number
  note: string
  created_at: string
  active: boolean
  settings: any
  typical_values: any
  norms: any
}

export default function SettingsPage() {
  const [versions, setVersions] = useState<Version[]>([])
  const [uploadData, setUploadData] = useState('')

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setVersions(data)
      })
  }, [])

  const handleActivate = async (id: number) => {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    if (res.ok) {
      setVersions(versions.map(v => ({ ...v, active: v.id === id })))
    } else {
      alert('Failed to activate')
    }
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadData(event.target?.result as string)
      }
      reader.readAsText(file)
    }
  }

  const handleCreateCopy = async () => {
    if (!uploadData) return alert('Upload a JSON first')
    try {
      const parsed = JSON.parse(uploadData)
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: parsed.note || 'New Copy (Uploaded)',
          settings: parsed.settings || {},
          typical_values: parsed.typical_values || {},
          norms: parsed.norms || {}
        })
      })
      if (res.ok) {
        const newVersion = await res.json()
        setVersions([...versions, newVersion])
        alert('Version created!')
      } else {
        alert('Failed to create version')
      }
    } catch (e) {
      alert('Invalid JSON')
    }
  }

  const handleCalculateTypical = async () => {
    alert('Calculating typical values... This might take a bit.')
    const res = await fetch('/api/admin/settings/typical', {
      method: 'POST'
    })
    if (res.ok) {
      const typical = await res.json()
      alert('Calculated successfully. Check console for output.')
      console.log('Typical values:', typical)
    } else {
      alert('Failed to calculate typical values')
    }
  }

  const handleToggleQuick = async () => {
    const res = await fetch('/api/admin/settings/toggle-quick', { method: 'POST' });
    if (res.ok) {
      const newVersion = await res.json();
      setVersions(versions.map(v => ({ ...v, active: false })).concat([newVersion]));
    } else {
      alert('Failed to toggle quick version');
    }
  }

  const activeVersion = versions.find(v => v.active);
  const isQuickEnabled = activeVersion?.settings?.QUICK_VERSION_ENABLED ?? false;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Settings Management</h1>
        <button 
          onClick={handleToggleQuick} 
          className={`px-4 py-2 text-white font-bold rounded ${isQuickEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {isQuickEnabled ? 'Deactivate Quick Version' : 'Activate Quick Version'}
        </button>
      </div>
      
      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Version History</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b">
              <th className="p-2">ID</th>
              <th className="p-2">Note</th>
              <th className="p-2">Created At</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {versions.map(v => (
              <tr key={v.id} className="border-b">
                <td className="p-2">{v.id}</td>
                <td className="p-2">{v.note}</td>
                <td className="p-2">{new Date(v.created_at).toLocaleDateString()}</td>
                <td className="p-2">
                  {v.active ? (
                    <span className="text-green-600 font-bold">Active</span>
                  ) : (
                    <span className="text-gray-500">Inactive</span>
                  )}
                </td>
                <td className="p-2">
                  {!v.active && (
                    <button 
                      onClick={() => handleActivate(v.id)}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                    >
                      Activate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload New Version JSON</h2>
        <div className="flex gap-4 items-center">
          <input type="file" accept=".json" onChange={handleUpload} className="border p-2" />
          <button 
            onClick={handleCreateCopy}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Create New Version
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Typical Values</h2>
        <p className="mb-4 text-gray-600">Recalculate typical average values for metrics based on real database records.</p>
        <button 
          onClick={handleCalculateTypical}
          className="px-4 py-2 bg-purple-600 text-white rounded"
        >
          Calculate Typical Values
        </button>
      </div>
    </div>
  )
}
