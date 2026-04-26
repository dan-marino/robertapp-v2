import type { Position, PreferenceTier } from './types'

export interface ParsedPlayer {
  name: string
  gender: 'M' | 'F'
}

export interface ParsedPreference {
  playerName: string
  position: Position
  tier: PreferenceTier
}

export interface ParsePlayerCSVResult {
  players: ParsedPlayer[]
  preferences: ParsedPreference[]
  skipped: string[]
}

const VALID_TIERS = new Set<string>(['Tier1', 'Tier2', 'Tier3', 'Anti'])
const POSITION_COLUMNS = new Set<string>(['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'LCF', 'RCF', 'RF'])

export function parsePlayerCSV(csvText: string): ParsePlayerCSVResult {
  const players: ParsedPlayer[] = []
  const preferences: ParsedPreference[] = []
  const skipped: string[] = []

  const lines = csvText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
  if (lines.length < 2) return { players, preferences, skipped }

  const headers = lines[0].split(',').map((h) => h.trim())
  const nameIdx = headers.indexOf('name')
  const genderIdx = headers.indexOf('gender')

  const seen = new Map<string, boolean>() // lowercased name -> seen

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim())
    const name = nameIdx >= 0 ? (cols[nameIdx] ?? '') : ''
    const gender = genderIdx >= 0 ? (cols[genderIdx] ?? '') : ''

    if (!name) continue

    const key = name.toLowerCase()
    if (seen.has(key)) {
      skipped.push(name)
      continue
    }
    seen.set(key, true)

    if (gender !== 'M' && gender !== 'F') continue

    players.push({ name, gender })

    // Parse position columns
    for (let h = 0; h < headers.length; h++) {
      const col = headers[h]
      if (!POSITION_COLUMNS.has(col)) continue
      const val = cols[h] ?? ''
      if (!val) continue
      if (!VALID_TIERS.has(val)) continue
      preferences.push({
        playerName: name,
        position: col as Position,
        tier: val as PreferenceTier,
      })
    }
  }

  return { players, preferences, skipped }
}
