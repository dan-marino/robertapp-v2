export type PACounts = {
  s1b: number
  s2b: number
  s3b: number
  hr: number
  bb: number
  k: number
  fo: number
  fc: number
  go: number
  sf: number
}

export type ParseResult = {
  counts: PACounts
  errors: string[]
}

const TOKEN_MAP: Record<string, keyof PACounts> = {
  '1B': 's1b',
  '2B': 's2b',
  '3B': 's3b',
  HR: 'hr',
  BB: 'bb',
  K: 'k',
  FO: 'fo',
  FC: 'fc',
  GO: 'go',
  SF: 'sf',
}

function zeroCounts(): PACounts {
  return { s1b: 0, s2b: 0, s3b: 0, hr: 0, bb: 0, k: 0, fo: 0, fc: 0, go: 0, sf: 0 }
}

export function parsePA(input: string): ParseResult {
  const counts = zeroCounts()
  const errors: string[] = []

  const trimmed = input.trim()
  if (trimmed === '') return { counts, errors }

  const tokens = trimmed.split(/\s+/)
  for (const token of tokens) {
    const key = TOKEN_MAP[token]
    if (key !== undefined) {
      counts[key]++
    } else {
      errors.push(`Unknown token: "${token}"`)
    }
  }

  return { counts, errors }
}
