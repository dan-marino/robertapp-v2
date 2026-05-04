'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  playerId: string
  initialName: string
  initialGender: 'M' | 'F'
}

export default function PlayerEditor({ playerId, initialName, initialGender }: Props) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [gender, setGender] = useState<'M' | 'F'>(initialGender)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch(`/api/players/${playerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, gender }),
    })
    setSaving(false)
    setSaved(true)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-end">
      <div className="flex-1">
        <label className="block text-xs text-zinc-500 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setSaved(false) }}
          required
          className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Gender</label>
        <select
          value={gender}
          onChange={(e) => { setGender(e.target.value as 'M' | 'F'); setSaved(false) }}
          className="border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        >
          <option value="M">M</option>
          <option value="F">F</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-md hover:bg-zinc-700 disabled:opacity-50"
      >
        {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
      </button>
    </form>
  )
}
