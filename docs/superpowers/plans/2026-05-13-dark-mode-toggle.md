# Dark Mode Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a sun/moon toggle in the nav bar that switches between light and dark mode, persisted to localStorage, defaulting to OS preference.

**Architecture:** Use `next-themes` for SSR-safe theme management with class-based dark mode. Tailwind v4 is configured to apply `dark:` variants when the `<html>` element has class `dark`. A client-side `ThemeProvider` wraps the app, and a `ThemeToggle` button lives at the right edge of the nav bar.

**Tech Stack:** next-themes, Tailwind CSS v4 (class-based dark via `@variant dark`), Next.js App Router

---

## Color Mapping Reference

These patterns apply throughout all tasks below:

| Light | Dark |
|-------|------|
| `bg-white` | `dark:bg-zinc-900` |
| `bg-zinc-50` | `dark:bg-zinc-800` |
| `bg-zinc-100` | `dark:bg-zinc-800` |
| `bg-zinc-200` | `dark:bg-zinc-700` |
| `border-zinc-100` | `dark:border-zinc-800` |
| `border-zinc-200` | `dark:border-zinc-700` |
| `border-zinc-300` | `dark:border-zinc-600` |
| `divide-zinc-100` | `dark:divide-zinc-800` |
| `text-zinc-900` | `dark:text-zinc-100` |
| `text-zinc-800` | `dark:text-zinc-200` |
| `text-zinc-700` | `dark:text-zinc-300` |
| `text-zinc-600` | `dark:text-zinc-400` |
| `text-zinc-500` | `dark:text-zinc-400` |
| `text-zinc-400` | `dark:text-zinc-500` |
| `text-zinc-300` | `dark:text-zinc-600` |
| `hover:bg-zinc-50` | `dark:hover:bg-zinc-800` |
| `hover:bg-zinc-200` | `dark:hover:bg-zinc-700` |
| `hover:text-zinc-600` | `dark:hover:text-zinc-300` |
| `hover:text-zinc-800` | `dark:hover:text-zinc-200` |
| Inputs (no bg): `border-zinc-200` | add `dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700` |
| Secondary btn: `bg-zinc-100 text-zinc-800 border-zinc-300 hover:bg-zinc-200` | add `dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-600 dark:hover:bg-zinc-700` |
| Primary btn: `bg-zinc-900 text-white hover:bg-zinc-700` | already dark-mode friendly ✓ |
| Panel: `border border-zinc-200 ... bg-white` | add `dark:border-zinc-700 dark:bg-zinc-900` |
| `bg-green-100 text-green-800 border-green-200` | add `dark:bg-green-900/40 dark:text-green-300 dark:border-green-800` |
| `bg-red-100 text-red-700 border-red-200` | add `dark:bg-red-900/40 dark:text-red-300 dark:border-red-800` |
| `bg-yellow-100 text-yellow-800 border-yellow-200` | add `dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800` |
| `bg-red-50 border-red-200 text-red-800` | add `dark:bg-red-950 dark:border-red-900 dark:text-red-300` |
| `bg-yellow-50 border-yellow-200 text-yellow-800` | add `dark:bg-yellow-950 dark:border-yellow-900 dark:text-yellow-300` |
| `bg-blue-50 text-blue-800 border-blue-300` | add `dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800` |

---

### Task 1: Install next-themes + configure globals.css for class-based dark mode

**Files:**
- Modify: `src/app/globals.css`
- Run: `npm install next-themes`

- [ ] **Step 1: Install next-themes**

```bash
npm install next-themes
```

Expected output: `added 1 package` (or similar)

- [ ] **Step 2: Update globals.css to use class-based dark mode**

Replace the entire contents of `src/app/globals.css`:

```css
@import "tailwindcss";

/* Class-based dark mode for next-themes */
@variant dark (&:where(.dark, .dark *));

:root {
  --background: #ffffff;
  --foreground: #171717;
}

.dark {
  --background: #0a0a0a;
  --foreground: #ededed;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css package.json package-lock.json
git commit -m "feat: install next-themes, configure Tailwind v4 class-based dark mode"
```

---

### Task 2: Create ThemeProvider and ThemeToggle components

**Files:**
- Create: `src/app/providers.tsx`
- Create: `src/app/ThemeToggle.tsx`

- [ ] **Step 1: Create src/app/providers.tsx**

```tsx
'use client'

import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  )
}
```

- [ ] **Step 2: Create src/app/ThemeToggle.tsx**

The toggle shows a moon icon in light mode (click to go dark) and a sun icon in dark mode (click to go light). It is mounted-gated to prevent hydration mismatch.

```tsx
'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    // Placeholder to prevent layout shift
    return <div className="w-8 h-8" />
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="p-2 rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/providers.tsx src/app/ThemeToggle.tsx
git commit -m "feat: add ThemeProvider and ThemeToggle (sun/moon) components"
```

---

### Task 3: Update layout.tsx — wrap with Providers, add ThemeToggle to nav

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Replace layout.tsx**

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Providers } from "./providers";
import ThemeToggle from "./ThemeToggle";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Softball Lineup Generator",
  description: "Co-ed softball lineup and position fairness app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
        <Providers>
          <nav className="border-b border-zinc-100 dark:border-zinc-800">
            <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-6">
              <Link
                href="/"
                className="text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                Seasons
              </Link>
              <Link
                href="/players"
                className="text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                Players
              </Link>
              <div className="ml-auto">
                <ThemeToggle />
              </div>
            </div>
          </nav>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

Note: `suppressHydrationWarning` on `<html>` is required — next-themes modifies the class attribute server→client.

- [ ] **Step 2: Verify nav works**

Run `npm run dev`, open browser. Nav should show Seasons, Players links on left and sun/moon icon on right. Toggle should switch theme. Verify OS default is respected on first load.

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: wrap app with ThemeProvider, add ThemeToggle to nav bar"
```

---

### Task 4: Fix src/app/page.tsx (home/seasons page)

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace page.tsx**

```tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Season {
  id: string
  name: string
  gameCount: number
}

export default function Home() {
  const router = useRouter()
  const [seasons, setSeasons] = useState<Season[]>([])
  const [name, setName] = useState('')
  const [gameCount, setGameCount] = useState(6)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetch('/api/seasons')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(setSeasons)
      .catch((err) => console.error('Failed to load seasons:', err))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    const res = await fetch('/api/seasons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, gameCount }),
    })
    const season = await res.json()
    setCreating(false)
    router.push(`/seasons/${season.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-8">Softball Lineup Generator</h1>

      <section className="mb-10">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
          New Season
        </h2>
        <form onSubmit={handleCreate} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Season name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Spring 2025"
              className="w-full border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Games</label>
            <input
              type="number"
              min={1}
              value={gameCount}
              onChange={(e) => setGameCount(Number(e.target.value))}
              className="w-20 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-md hover:bg-zinc-700 disabled:opacity-50"
          >
            {creating ? 'Creating…' : 'Create'}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
          Seasons
        </h2>
        {seasons.length === 0 ? (
          <p className="text-zinc-400 dark:text-zinc-500 text-sm">No seasons yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-lg overflow-hidden">
            {seasons.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/seasons/${s.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <span className="text-sm font-medium">{s.name}</span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">{s.gameCount} games</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add dark mode to home/seasons page"
```

---

### Task 5: Fix src/app/seasons/[id]/page.tsx + GameCreator.tsx

**Files:**
- Modify: `src/app/seasons/[id]/page.tsx`
- Modify: `src/app/seasons/[id]/GameCreator.tsx`

- [ ] **Step 1: Replace src/app/seasons/[id]/page.tsx**

```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/db'
import { games, players, rosters, seasons } from '@/db/schema'
import { eq } from 'drizzle-orm'
import RosterManager from './RosterManager'
import GameCreator from './GameCreator'

export default async function SeasonPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [season] = await db.select().from(seasons).where(eq(seasons.id, id))
  if (!season) notFound()

  const seasonGames = await db
    .select()
    .from(games)
    .where(eq(games.seasonId, id))
    .orderBy(games.date)

  const rosterRows = await db
    .select({ player: players })
    .from(rosters)
    .innerJoin(players, eq(rosters.playerId, players.id))
    .where(eq(rosters.seasonId, id))

  const roster = rosterRows.map((r) => r.player)

  const pool = await db
    .select()
    .from(players)
    .where(eq(players.isGuest, false))

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200">
          ← All seasons
        </Link>
      </div>

      <h1 className="text-2xl font-semibold mb-1">{season.name}</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">{season.gameCount} games</p>

      <section className="mb-10">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
          Games
        </h2>
        {seasonGames.length > 0 && (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-lg overflow-hidden mb-4">
            {seasonGames.map((game) => (
              <li key={game.id}>
                <Link
                  href={`/games/${game.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <span className="text-sm font-medium">{game.date}</span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    {game.inningCount} inn · {game.mode}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <GameCreator seasonId={id} />
      </section>

      <RosterManager seasonId={id} initialRoster={roster} initialPool={pool} />
    </div>
  )
}
```

- [ ] **Step 2: Replace src/app/seasons/[id]/GameCreator.tsx**

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  seasonId: string
}

export default function GameCreator({ seasonId }: Props) {
  const router = useRouter()
  const [date, setDate] = useState('')
  const [inningCount, setInningCount] = useState<5 | 6>(6)
  const [mode, setMode] = useState<'Unified' | 'Split'>('Unified')
  const [time, setTime] = useState('')
  const [opponent, setOpponent] = useState('')
  const [creating, setCreating] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    const res = await fetch(`/api/seasons/${seasonId}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        inningCount,
        mode,
        time: time || undefined,
        opponent: opponent || undefined,
      }),
    })
    const game = await res.json()
    setCreating(false)
    router.push(`/games/${game.id}`)
  }

  const inputClass = "border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"

  return (
    <form onSubmit={handleCreate} className="flex gap-3 items-end flex-wrap">
      <div>
        <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Time</label>
        <input
          type="text"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          placeholder="6:30 PM"
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Opponent</label>
        <input
          type="text"
          value={opponent}
          onChange={(e) => setOpponent(e.target.value)}
          placeholder="Team name"
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Innings</label>
        <select
          value={inningCount}
          onChange={(e) => setInningCount(Number(e.target.value) as 5 | 6)}
          className={inputClass}
        >
          <option value={6}>6</option>
          <option value={5}>5</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Mode</label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as 'Unified' | 'Split')}
          className={inputClass}
        >
          <option value="Unified">Unified</option>
          <option value="Split">Split</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={creating}
        className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-md hover:bg-zinc-700 disabled:opacity-50"
      >
        {creating ? 'Creating…' : 'Add game'}
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/seasons/[id]/page.tsx" "src/app/seasons/[id]/GameCreator.tsx"
git commit -m "feat: add dark mode to season page and GameCreator"
```

---

### Task 6: Fix src/app/seasons/[id]/RosterPicker.tsx

**Files:**
- Modify: `src/app/seasons/[id]/RosterPicker.tsx`

- [ ] **Step 1: Replace RosterPicker.tsx**

```tsx
'use client'

import { useState } from 'react'

interface Player {
  id: string
  name: string
  gender: 'M' | 'F'
  isGuest: boolean
}

interface Props {
  seasonId: string
  initialRoster: Player[]
  initialPool: Player[]
}

export default function RosterPicker({ seasonId, initialRoster, initialPool }: Props) {
  const [roster, setRoster] = useState<Player[]>(initialRoster)
  const [search, setSearch] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newGender, setNewGender] = useState<'M' | 'F'>('M')
  const [addingId, setAddingId] = useState<string | null>(null)
  const [addingNew, setAddingNew] = useState(false)

  const rosterIds = new Set(roster.map((p) => p.id))

  const availablePlayers = initialPool.filter(
    (p) =>
      !rosterIds.has(p.id) &&
      p.name.toLowerCase().includes(search.toLowerCase())
  )

  async function handleAddExisting(player: Player) {
    setAddingId(player.id)
    const res = await fetch(`/api/seasons/${seasonId}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: player.id }),
    })
    if (res.ok) {
      const added = await res.json()
      setRoster((prev) => [...prev, added])
    }
    setAddingId(null)
  }

  async function handleRemove(playerId: string) {
    await fetch(`/api/seasons/${seasonId}/players/${playerId}`, { method: 'DELETE' })
    setRoster((prev) => prev.filter((p) => p.id !== playerId))
  }

  async function handleAddNew(e: React.FormEvent) {
    e.preventDefault()
    setAddingNew(true)
    const res = await fetch(`/api/seasons/${seasonId}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, gender: newGender }),
    })
    if (res.ok) {
      const player = await res.json()
      setRoster((prev) => [...prev, player])
      setNewName('')
      setShowNewForm(false)
    }
    setAddingNew(false)
  }

  const inputClass = "border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"

  return (
    <section>
      <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
        Roster
      </h2>

      {roster.length === 0 ? (
        <p className="text-zinc-400 dark:text-zinc-500 text-sm mb-4">No players yet.</p>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-lg overflow-hidden mb-4">
          {roster.map((player) => (
            <li
              key={player.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-xs">&#10003;</span>
                <a
                  href={`/players/${player.id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {player.name}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-400 dark:text-zinc-500">{player.gender}</span>
                <button
                  onClick={() => handleRemove(player.id)}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded-lg p-4 mb-4">
        <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
          Add from player pool
        </h3>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search players…"
          className={`w-full ${inputClass} mb-3`}
        />

        {availablePlayers.length === 0 ? (
          <p className="text-zinc-400 dark:text-zinc-500 text-sm">
            {search ? 'No players match your search.' : 'All players are already on the roster.'}
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-lg overflow-hidden">
            {availablePlayers.map((player) => (
              <li
                key={player.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{player.name}</span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">{player.gender}</span>
                </div>
                <button
                  onClick={() => handleAddExisting(player)}
                  disabled={addingId === player.id}
                  className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium disabled:opacity-50"
                >
                  {addingId === player.id ? 'Adding…' : 'Add'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showNewForm ? (
        <form onSubmit={handleAddNew} className="border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded-lg p-4">
          <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
            New player
          </h3>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                placeholder="Player name"
                className={`w-full ${inputClass}`}
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Gender</label>
              <select
                value={newGender}
                onChange={(e) => setNewGender(e.target.value as 'M' | 'F')}
                className={inputClass}
              >
                <option value="M">M</option>
                <option value="F">F</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={addingNew}
              className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-md hover:bg-zinc-700 disabled:opacity-50"
            >
              {addingNew ? 'Adding…' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowNewForm(true)}
          className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 underline"
        >
          + Add new player
        </button>
      )}
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/seasons/[id]/RosterPicker.tsx"
git commit -m "feat: add dark mode to RosterPicker"
```

---

### Task 7: Fix src/app/games/[id]/page.tsx + GameEditor.tsx + ModeToggle.tsx

**Files:**
- Modify: `src/app/games/[id]/page.tsx`
- Modify: `src/app/games/[id]/GameEditor.tsx`
- Modify: `src/app/games/[id]/ModeToggle.tsx`

- [ ] **Step 1: Replace src/app/games/[id]/page.tsx**

```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/db'
import { games, players, rosters, rsvps, seasons, fieldingSlots } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'
import RSVPManager from './RSVPManager'
import ModeToggle from './ModeToggle'
import GameEditor from './GameEditor'
import type { RSVPStatus } from '@/domain/types'

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [game] = await db.select().from(games).where(eq(games.id, id))
  if (!game) notFound()

  const [season] = await db.select().from(seasons).where(eq(seasons.id, game.seasonId))

  const rosterRows = await db
    .select({ player: players })
    .from(rosters)
    .innerJoin(players, eq(rosters.playerId, players.id))
    .where(eq(rosters.seasonId, game.seasonId))

  const rsvpRows = await db.select().from(rsvps).where(eq(rsvps.gameId, id))
  const rsvpMap = new Map(rsvpRows.map((r) => [r.playerId, r.status as RSVPStatus]))

  const guestIds = rsvpRows
    .map((r) => r.playerId)
    .filter((pid) => !rosterRows.some((row) => row.player.id === pid))

  const guestRows =
    guestIds.length > 0
      ? await db.select().from(players).where(inArray(players.id, guestIds))
      : []

  const allPlayers = [
    ...rosterRows.map((r) => r.player),
    ...guestRows.filter((g) => g.isGuest),
  ]

  const initialRsvps = allPlayers.map((player) => ({
    player,
    status: rsvpMap.get(player.id) ?? null,
  }))

  const existingLineup = await db
    .select({ id: fieldingSlots.id })
    .from(fieldingSlots)
    .where(eq(fieldingSlots.gameId, id))
    .limit(1)
  const hasLineup = existingLineup.length > 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/seasons/${game.seasonId}`}
          className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← {season?.name ?? 'Season'}
        </Link>
      </div>

      <div className="flex items-start justify-between mb-8 gap-4">
        <GameEditor
          gameId={id}
          initialDate={game.date}
          initialTime={game.time ?? null}
          initialOpponent={game.opponent ?? null}
          initialInningCount={game.inningCount}
        />
        <ModeToggle gameId={id} initialMode={game.mode as 'Unified' | 'Split'} />
      </div>

      <section className="mb-10">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
          RSVPs
        </h2>
        <RSVPManager gameId={id} initialRsvps={initialRsvps} />
      </section>

      <section>
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
          Lineup
        </h2>
        {hasLineup ? (
          <Link
            href={`/games/${id}/lineup`}
            className="inline-block px-4 py-2 bg-zinc-900 text-white text-sm rounded-md hover:bg-zinc-700"
          >
            View Lineup →
          </Link>
        ) : (
          <div className="flex items-center gap-4">
            <p className="text-zinc-400 dark:text-zinc-500 text-sm">No lineup generated yet.</p>
            <Link
              href={`/games/${id}/lineup`}
              className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 underline"
            >
              Generate →
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Replace src/app/games/[id]/GameEditor.tsx**

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  gameId: string
  initialDate: string
  initialTime: string | null
  initialOpponent: string | null
  initialInningCount: number
}

export default function GameEditor({
  gameId,
  initialDate,
  initialTime,
  initialOpponent,
  initialInningCount,
}: Props) {
  const router = useRouter()
  const [date, setDate] = useState(initialDate)
  const [time, setTime] = useState(initialTime ?? '')
  const [opponent, setOpponent] = useState(initialOpponent ?? '')
  const [inningCount, setInningCount] = useState<5 | 6>(initialInningCount as 5 | 6)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const payload: Record<string, unknown> = {}
    if (date !== initialDate) payload.date = date
    if (inningCount !== initialInningCount) payload.inningCount = inningCount
    if (time !== (initialTime ?? '')) payload.time = time || null
    if (opponent !== (initialOpponent ?? '')) payload.opponent = opponent || null

    if (Object.keys(payload).length === 0) return

    setSaving(true)
    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to save')
        return
      }
      router.refresh()
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-3 items-end flex-wrap">
        <div>
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Time</label>
          <input
            type="text"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="6:30 PM"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Opponent</label>
          <input
            type="text"
            value={opponent}
            onChange={(e) => setOpponent(e.target.value)}
            placeholder="Team name"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Innings</label>
          <select
            value={inningCount}
            onChange={(e) => setInningCount(Number(e.target.value) as 5 | 6)}
            className={inputClass}
          >
            <option value={6}>6</option>
            <option value={5}>5</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-md hover:bg-zinc-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </form>
  )
}
```

- [ ] **Step 3: Replace src/app/games/[id]/ModeToggle.tsx**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  gameId: string
  initialMode: 'Unified' | 'Split'
}

export default function ModeToggle({ gameId, initialMode }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<'Unified' | 'Split'>(initialMode)
  const [saving, setSaving] = useState(false)

  async function handleToggle(newMode: 'Unified' | 'Split') {
    if (newMode === mode) return
    setSaving(true)
    const res = await fetch(`/api/games/${gameId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: newMode }),
    })
    setSaving(false)
    if (res.ok) {
      setMode(newMode)
      router.refresh()
    }
  }

  return (
    <div className="flex items-center gap-1 text-sm">
      <span className="text-zinc-500 dark:text-zinc-400 mr-2">Mode</span>
      {(['Unified', 'Split'] as const).map((m) => (
        <button
          key={m}
          onClick={() => handleToggle(m)}
          disabled={saving}
          className={`px-3 py-1 rounded-md border text-sm transition-colors ${
            mode === m
              ? 'bg-zinc-900 text-white border-zinc-900'
              : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-300 dark:border-zinc-600 hover:border-zinc-500 dark:hover:border-zinc-400'
          } disabled:opacity-50`}
        >
          {m}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/games/[id]/page.tsx" "src/app/games/[id]/GameEditor.tsx" "src/app/games/[id]/ModeToggle.tsx"
git commit -m "feat: add dark mode to game page, GameEditor, ModeToggle"
```

---

### Task 8: Fix RSVPManager.tsx + GuestAdder.tsx

**Files:**
- Modify: `src/app/games/[id]/RSVPManager.tsx`
- Modify: `src/app/games/[id]/GuestAdder.tsx`

- [ ] **Step 1: Replace RSVPManager.tsx**

```tsx
'use client'

import { useState } from 'react'
import type { RSVPStatus } from '@/domain/types'
import GuestAdder from './GuestAdder'

interface Player {
  id: string
  name: string
  gender: 'M' | 'F'
  isGuest: boolean
}

interface PlayerRSVP {
  player: Player
  status: RSVPStatus | null
}

interface Props {
  gameId: string
  initialRsvps: PlayerRSVP[]
}

const STATUSES: RSVPStatus[] = ['Present', 'Absent', 'Late']

const STATUS_COLORS: Record<RSVPStatus, string> = {
  Present: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800',
  Absent: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800',
  Late: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800',
}

export default function RSVPManager({ gameId, initialRsvps }: Props) {
  const [rsvps, setRsvps] = useState<PlayerRSVP[]>(initialRsvps)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function setStatus(playerId: string, status: RSVPStatus) {
    setRsvps((prev) =>
      prev.map((r) => (r.player.id === playerId ? { ...r, status } : r))
    )
    setSaved(false)
  }

  async function handleRemoveGuest(guestId: string) {
    await fetch(`/api/games/${gameId}/guests/${guestId}`, { method: 'DELETE' })
    setRsvps((prev) => prev.filter((r) => r.player.id !== guestId))
  }

  function handleGuestAdded(guest: Player) {
    setRsvps((prev) => [...prev, { player: guest, status: 'Present' }])
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/games/${gameId}/rsvps`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        rsvps
          .filter((r) => r.status !== null)
          .map((r) => ({ playerId: r.player.id, status: r.status }))
      ),
    })
    setSaving(false)
    setSaved(true)
  }

  return (
    <div>
      {rsvps.length > 0 && (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-lg overflow-hidden mb-4">
          {rsvps.map(({ player, status }) => (
            <li key={player.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium flex items-center gap-2">
                {player.name}
                <span className="text-xs text-zinc-400 dark:text-zinc-500">{player.gender}</span>
                {player.isGuest && (
                  <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded">
                    Guest
                  </span>
                )}
              </span>
              <div className="flex items-center gap-1">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(player.id, s)}
                    className={`px-2 py-1 text-xs rounded border font-medium transition-colors ${
                      status === s
                        ? STATUS_COLORS[s]
                        : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
                    }`}
                  >
                    {s}
                  </button>
                ))}
                {player.isGuest && (
                  <button
                    onClick={() => handleRemoveGuest(player.id)}
                    className="ml-2 text-xs text-red-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {rsvps.length === 0 && (
        <p className="text-zinc-400 dark:text-zinc-500 text-sm mb-4">No players on roster yet.</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving || rsvps.length === 0}
        className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-md hover:bg-zinc-700 disabled:opacity-50"
      >
        {saving ? 'Saving…' : saved ? 'Saved' : 'Save RSVPs'}
      </button>

      <GuestAdder gameId={gameId} onGuestAdded={handleGuestAdded} />
    </div>
  )
}
```

- [ ] **Step 2: Replace GuestAdder.tsx**

```tsx
'use client'

import { useState } from 'react'

interface Player {
  id: string
  name: string
  gender: 'M' | 'F'
  isGuest: boolean
}

interface Props {
  gameId: string
  onGuestAdded: (guest: Player) => void
}

export default function GuestAdder({ gameId, onGuestAdded }: Props) {
  const [name, setName] = useState('')
  const [gender, setGender] = useState<'M' | 'F'>('M')
  const [adding, setAdding] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    const res = await fetch(`/api/games/${gameId}/guests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, gender }),
    })
    const guest = await res.json()
    onGuestAdded(guest)
    setName('')
    setAdding(false)
  }

  const inputClass = "border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"

  return (
    <form onSubmit={handleAdd} className="flex gap-3 items-end mt-3">
      <div className="flex-1">
        <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Guest name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Guest player"
          className={`w-full ${inputClass}`}
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Gender</label>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value as 'M' | 'F')}
          className={inputClass}
        >
          <option value="M">M</option>
          <option value="F">F</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={adding}
        className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-md hover:bg-zinc-700 disabled:opacity-50"
      >
        {adding ? 'Adding…' : 'Add guest'}
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/games/[id]/RSVPManager.tsx" "src/app/games/[id]/GuestAdder.tsx"
git commit -m "feat: add dark mode to RSVPManager and GuestAdder"
```

---

### Task 9: Fix lineup/page.tsx + GenerateLineupButton.tsx + ReshuffleButton.tsx

**Files:**
- Modify: `src/app/games/[id]/lineup/page.tsx`
- Modify: `src/app/games/[id]/lineup/GenerateLineupButton.tsx`
- Modify: `src/app/games/[id]/lineup/ReshuffleButton.tsx`

- [ ] **Step 1: Replace src/app/games/[id]/lineup/page.tsx**

```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/db'
import { games, players, fieldingSlots, battingSlots, seasons } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'
import GenerateLineupButton from './GenerateLineupButton'
import ReshuffleButton from './ReshuffleButton'
import LineupSwapGrid from './LineupSwapGrid'

export default async function LineupPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: gameId } = await params

  const [game] = await db.select().from(games).where(eq(games.id, gameId))
  if (!game) notFound()

  await db.select().from(seasons).where(eq(seasons.id, game.seasonId))

  const [fs, bs] = await Promise.all([
    db.select().from(fieldingSlots).where(eq(fieldingSlots.gameId, gameId)),
    db.select().from(battingSlots).where(eq(battingSlots.gameId, gameId)),
  ])

  const playerIds = [...new Set([...fs.map((s) => s.playerId), ...bs.map((s) => s.playerId)])]
  const playerRows =
    playerIds.length > 0
      ? await db.select().from(players).where(inArray(players.id, playerIds))
      : []
  const playerMap: Record<string, { name: string; gender: 'M' | 'F' }> = Object.fromEntries(
    playerRows.map((p) => [p.id, { name: p.name, gender: p.gender as 'M' | 'F' }])
  )

  const innings = [...new Set(fs.map((s) => s.inning))].sort((a, b) => a - b)
  const hasLineup = fs.length > 0 || bs.length > 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/games/${gameId}`} className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200">
          ← {game.date}
        </Link>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Lineup</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {game.date} · {game.inningCount} innings · {game.mode} mode
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasLineup && (
            <a
              href={`/api/games/${gameId}/lineup/export`}
              download
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-sm rounded-md border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            >
              Export CSV
            </a>
          )}
          {hasLineup && <ReshuffleButton gameId={gameId} />}
          <GenerateLineupButton gameId={gameId} />
        </div>
      </div>

      {!hasLineup && (
        <p className="text-zinc-400 dark:text-zinc-500 text-sm">
          No lineup generated yet. Save RSVPs and click &quot;Generate Lineup&quot; above.
        </p>
      )}

      {hasLineup && (
        <LineupSwapGrid
          key={fs.map((s) => `${s.inning}:${s.position}:${s.playerId}`).sort().join('|')}
          gameId={gameId}
          mode={game.mode as 'Unified' | 'Split'}
          initialFieldingSlots={fs.map((s) => ({
            gameId: s.gameId,
            inning: s.inning,
            playerId: s.playerId,
            position: s.position,
          }))}
          initialBattingSlots={bs.map((s) => ({
            gameId: s.gameId,
            playerId: s.playerId,
            orderIndex: s.orderIndex,
            genderGroup: s.genderGroup,
          }))}
          initialInnings={innings}
          playerMap={playerMap}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Replace GenerateLineupButton.tsx**

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function GenerateLineupButton({ gameId }: { gameId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/games/${gameId}/lineup/generate`, { method: 'POST' })
    setLoading(false)
    if (res.ok) {
      router.refresh()
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Failed to generate lineup')
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-md hover:bg-zinc-700 disabled:opacity-50"
      >
        {loading ? 'Generating…' : 'Generate Lineup'}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
```

Note: GenerateLineupButton only uses `bg-zinc-900 text-white` (already dark-friendly) and `text-red-500` — no changes needed except confirming. The file above is unchanged from original but included for completeness.

- [ ] **Step 3: Replace ReshuffleButton.tsx**

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ReshuffleButton({ gameId }: { gameId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleReshuffle() {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/games/${gameId}/lineup/reshuffle`, { method: 'POST' })
    setLoading(false)
    if (res.ok) {
      router.refresh()
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Reshuffle failed')
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleReshuffle}
        disabled={loading}
        className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-sm rounded-md border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50"
      >
        {loading ? 'Reshuffling…' : 'Reshuffle'}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/games/[id]/lineup/page.tsx" "src/app/games/[id]/lineup/GenerateLineupButton.tsx" "src/app/games/[id]/lineup/ReshuffleButton.tsx"
git commit -m "feat: add dark mode to lineup page, GenerateLineupButton, ReshuffleButton"
```

---

### Task 10: Fix LineupSwapGrid.tsx

**Files:**
- Modify: `src/app/games/[id]/lineup/LineupSwapGrid.tsx`

This is the most complex file. Changes cover: position badges, table rows, table header border, player picker panel, add-slot panel, violations, drag handle.

- [ ] **Step 1: Replace LineupSwapGrid.tsx**

```tsx
'use client'

import { useState } from 'react'
import type { Violation } from '@/domain/constraintValidator'
import { ALL_POSITIONS } from '@/domain/types'

interface FieldingSlot {
  gameId: string
  inning: number
  playerId: string
  position: string
}

interface BattingSlot {
  gameId: string
  playerId: string
  orderIndex: number
  genderGroup: string
}

interface PlayerInfo {
  name: string
  gender: 'M' | 'F'
}

interface Props {
  gameId: string
  mode: 'Unified' | 'Split'
  initialFieldingSlots: FieldingSlot[]
  initialBattingSlots: BattingSlot[]
  initialInnings: number[]
  playerMap: Record<string, PlayerInfo>
}

interface CellKey {
  inning: number
  position: string
}

function PositionBadge({
  position,
  isActive,
  isEmpty,
  onClick,
}: {
  position: string | null
  isActive: boolean
  isEmpty: boolean
  onClick: () => void
}) {
  if (isEmpty) {
    return (
      <button
        onClick={onClick}
        className="inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs text-zinc-300 dark:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors"
      >
        –
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
        isActive
          ? 'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 ring-2 ring-blue-400'
          : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
      }`}
    >
      {position}
    </button>
  )
}

export default function LineupSwapGrid({
  gameId,
  mode,
  initialFieldingSlots,
  initialBattingSlots,
  initialInnings,
  playerMap,
}: Props) {
  const [fieldingSlots, setFieldingSlots] = useState(initialFieldingSlots)
  const [battingSlots, setBattingSlots] = useState(initialBattingSlots)
  const [activeCell, setActiveCell] = useState<CellKey | null>(null)
  const [violations, setViolations] = useState<Violation[]>([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [pendingAddSlot, setPendingAddSlot] = useState<{ inning: number; playerId: string } | null>(null)
  const [draggedPlayer, setDraggedPlayer] = useState<{ playerId: string; group: string } | null>(null)
  const [dragOverPlayerId, setDragOverPlayerId] = useState<string | null>(null)

  const innings = initialInnings
  const errorViolations = violations.filter((v) => v.severity === 'error')
  const warningViolations = violations.filter((v) => v.severity === 'warning')

  const playerFieldingMap = new Map<string, Map<number, string>>()
  for (const slot of fieldingSlots) {
    if (!playerFieldingMap.has(slot.playerId)) {
      playerFieldingMap.set(slot.playerId, new Map())
    }
    playerFieldingMap.get(slot.playerId)!.set(slot.inning, slot.position)
  }

  const positionToPlayer = new Map<string, string>()
  for (const slot of fieldingSlots) {
    positionToPlayer.set(`${slot.inning}:${slot.position}`, slot.playerId)
  }

  async function handleAssign(inning: number, position: string, playerId: string | null) {
    setSaving(true)
    setSaveError(null)
    const res = await fetch(`/api/games/${gameId}/lineup/slot`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inning, position, playerId }),
    })
    setSaving(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setSaveError(body.error ?? 'Save failed')
      return
    }
    const { lineup, violations: newViolations } = await res.json()
    setFieldingSlots(lineup.fieldingSlots)
    setViolations(newViolations)
    setActiveCell(null)
    setPendingAddSlot(null)
  }

  function handleCellClick(inning: number, position: string) {
    if (activeCell?.inning === inning && activeCell?.position === position) {
      setActiveCell(null)
    } else {
      setActiveCell({ inning, position })
    }
  }

  async function handleBattingReorder(group: string, orderedPlayerIds: string[]) {
    setBattingSlots((prev) => {
      const updated = [...prev]
      orderedPlayerIds.forEach((pid, idx) => {
        const slot = updated.find((s) => s.playerId === pid && s.genderGroup === group)
        if (slot) slot.orderIndex = idx + 1
      })
      return updated
    })
    await fetch(`/api/games/${gameId}/lineup/batting-order`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ genderGroup: group, playerIds: orderedPlayerIds }),
    })
  }

  function handleDragStart(playerId: string, group: string) {
    setDraggedPlayer({ playerId, group })
  }

  function handleDragOver(e: React.DragEvent, playerId: string) {
    e.preventDefault()
    setDragOverPlayerId(playerId)
  }

  function handleDrop(targetPlayerId: string, group: string, orderedRows: { playerId: string }[]) {
    if (!draggedPlayer || draggedPlayer.group !== group) return
    const ids = orderedRows.map((r) => r.playerId)
    const fromIdx = ids.indexOf(draggedPlayer.playerId)
    const toIdx = ids.indexOf(targetPlayerId)
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return
    const reordered = [...ids]
    reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, draggedPlayer.playerId)
    handleBattingReorder(group, reordered)
    setDraggedPlayer(null)
    setDragOverPlayerId(null)
  }

  function handleDragEnd() {
    setDraggedPlayer(null)
    setDragOverPlayerId(null)
  }

  const sortedPlayers = Object.entries(playerMap).sort((a, b) =>
    a[1].name.localeCompare(b[1].name)
  )

  interface PlayerRow {
    playerId: string
    batOrder: number
    gender: 'M' | 'F'
  }

  const allBatting: PlayerRow[] = battingSlots.map((s) => ({
    playerId: s.playerId,
    batOrder: s.orderIndex,
    gender: playerMap[s.playerId]?.gender ?? 'M',
  }))

  const unifiedRows = [...allBatting].sort((a, b) => a.batOrder - b.batOrder)
  const mRows = allBatting.filter((r) => r.gender === 'M').sort((a, b) => a.batOrder - b.batOrder)
  const fRows = allBatting.filter((r) => r.gender === 'F').sort((a, b) => a.batOrder - b.batOrder)

  function renderRow(row: PlayerRow, isFemale: boolean, group: string, orderedRows: PlayerRow[]) {
    const playerInfo = playerMap[row.playerId]
    const isDragging = draggedPlayer?.playerId === row.playerId
    const isDragOver = dragOverPlayerId === row.playerId && draggedPlayer?.group === group
    return (
      <tr
        key={row.playerId}
        draggable
        onDragStart={() => handleDragStart(row.playerId, group)}
        onDragOver={(e) => handleDragOver(e, row.playerId)}
        onDrop={() => handleDrop(row.playerId, group, orderedRows)}
        onDragEnd={handleDragEnd}
        className={[
          isFemale && mode === 'Unified' ? 'bg-pink-50 dark:bg-pink-950/30' : '',
          isDragging ? 'opacity-40' : '',
          isDragOver ? 'border-t-2 border-blue-400' : '',
        ].filter(Boolean).join(' ')}
      >
        <td className="py-2.5 pl-1 pr-2 text-zinc-300 dark:text-zinc-600 cursor-grab select-none text-sm">
          ⠿
        </td>
        <td className="py-2.5 pr-4 text-sm font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
          {playerInfo?.name ?? row.playerId}
        </td>
        <td className="py-2.5 px-3 text-sm text-zinc-400 dark:text-zinc-500 text-right tabular-nums">
          {row.batOrder}
        </td>
        {innings.map((inning) => {
          const pos = playerFieldingMap.get(row.playerId)?.get(inning) ?? null
          return (
            <td key={inning} className="py-2.5 px-2 text-center">
              <PositionBadge
                position={pos}
                isActive={activeCell?.inning === inning && (
                  pos
                    ? activeCell?.position === pos && positionToPlayer.get(`${inning}:${pos}`) === row.playerId
                    : false
                )}
                isEmpty={pos === null}
                onClick={() => {
                  if (pos) {
                    setActiveCell({ inning, position: pos })
                    setPendingAddSlot(null)
                  } else {
                    setPendingAddSlot({ inning, playerId: row.playerId })
                    setActiveCell(null)
                  }
                }}
              />
            </td>
          )
        })}
      </tr>
    )
  }

  const tableHeader = (
    <tr className="border-b border-zinc-100 dark:border-zinc-800">
      <th className="py-2 pl-1 pr-2 w-5" />
      <th className="py-2 pr-4 text-left text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Name</th>
      <th className="py-2 px-3 text-right text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Bat</th>
      {innings.map((inning) => (
        <th key={inning} className="py-2 px-2 text-center text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide w-14">
          {inning}
        </th>
      ))}
    </tr>
  )

  const activeCellCurrentPlayerId = activeCell
    ? positionToPlayer.get(`${activeCell.inning}:${activeCell.position}`) ?? null
    : null

  return (
    <div>
      {/* Violations */}
      {violations.length > 0 && (
        <div className="mb-6 space-y-2">
          {errorViolations.map((v, i) => (
            <div key={i} className="flex items-start gap-2 px-3 py-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-md text-sm text-red-800 dark:text-red-300">
              <span className="font-semibold shrink-0">Error</span>
              <span>{v.message}</span>
            </div>
          ))}
          {warningViolations.map((v, i) => (
            <div key={i} className="flex items-start gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-900 rounded-md text-sm text-yellow-800 dark:text-yellow-300">
              <span className="font-semibold shrink-0">Warning</span>
              <span>{v.message}</span>
            </div>
          ))}
        </div>
      )}

      {saveError && (
        <div className="mb-4 px-3 py-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-md text-sm text-red-800 dark:text-red-300">
          {saveError}
        </div>
      )}

      {/* Lineup table */}
      <div className="overflow-x-auto mb-6">
        {mode === 'Unified' ? (
          <table className="w-full text-sm border-collapse">
            <thead>{tableHeader}</thead>
            <tbody>{unifiedRows.map((row) => renderRow(row, row.gender === 'F', 'All', unifiedRows))}</tbody>
          </table>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>{tableHeader}</thead>
            <tbody>
              <tr>
                <td colSpan={3 + innings.length} className="pt-3 pb-1 pl-1 text-sm font-semibold text-blue-600">
                  GUYS ({mRows.length})
                </td>
              </tr>
              {mRows.map((row) => renderRow(row, false, 'M', mRows))}
              <tr>
                <td colSpan={3 + innings.length} className="pt-4 pb-1 pl-1 text-sm font-semibold text-pink-500">
                  GIRLS ({fRows.length})
                </td>
              </tr>
              {fRows.map((row) => renderRow(row, false, 'F', fRows))}
            </tbody>
          </table>
        )}
      </div>

      {/* Player picker panel */}
      {activeCell && activeCell.position !== '__new__' && (
        <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Assign <span className="font-semibold">{activeCell.position}</span> — Inning {activeCell.inning}
              {activeCellCurrentPlayerId && (
                <span className="ml-2 text-zinc-400 dark:text-zinc-500 font-normal">
                  (currently {playerMap[activeCellCurrentPlayerId]?.name ?? activeCellCurrentPlayerId})
                </span>
              )}
            </p>
            <button onClick={() => setActiveCell(null)} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 text-xs">
              ✕ Close
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeCellCurrentPlayerId && (
              <button
                onClick={() => handleAssign(activeCell.inning, activeCell.position, null)}
                disabled={saving}
                className="px-3 py-1.5 text-xs rounded-md border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50"
              >
                Remove
              </button>
            )}
            {sortedPlayers.map(([pid, info]) => {
              const alreadyThisInning = playerFieldingMap.get(pid)?.get(activeCell.inning)
              const isCurrent = pid === activeCellCurrentPlayerId
              return (
                <button
                  key={pid}
                  onClick={() => handleAssign(activeCell.inning, activeCell.position, pid)}
                  disabled={saving || isCurrent}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors disabled:opacity-40 ${
                    isCurrent
                      ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200'
                      : alreadyThisInning
                      ? 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {info.name}
                  {alreadyThisInning && !isCurrent && (
                    <span className="ml-1 text-zinc-400 dark:text-zinc-500">({alreadyThisInning})</span>
                  )}
                </button>
              )
            })}
          </div>
          {saving && <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">Saving…</p>}
        </div>
      )}

      {/* Add slot panel: player known, pick position */}
      {pendingAddSlot && (
        <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Assign <span className="font-semibold">{playerMap[pendingAddSlot.playerId]?.name}</span> — Inning {pendingAddSlot.inning}
            </p>
            <button onClick={() => setPendingAddSlot(null)} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 text-xs">✕ Close</button>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Pick a position:</p>
          <div className="flex flex-wrap gap-2">
            {ALL_POSITIONS.filter((p) => !fieldingSlots.some((s) => s.inning === pendingAddSlot.inning && s.position === p)).map((pos) => (
              <button
                key={pos}
                onClick={() => handleAssign(pendingAddSlot.inning, pos, pendingAddSlot.playerId)}
                disabled={saving}
                className="px-3 py-1.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50"
              >
                {pos}
              </button>
            ))}
            {ALL_POSITIONS.every((p) => fieldingSlots.some((s) => s.inning === pendingAddSlot.inning && s.position === p)) && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500">All positions filled this inning.</p>
            )}
          </div>
          {saving && <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">Saving…</p>}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/games/[id]/lineup/LineupSwapGrid.tsx"
git commit -m "feat: add dark mode to LineupSwapGrid"
```

---

### Task 11: Fix players/page.tsx + PlayerList.tsx + AddPlayerForm.tsx + CSVImporter.tsx

**Files:**
- Modify: `src/app/players/PlayerList.tsx`
- Modify: `src/app/players/AddPlayerForm.tsx`
- Modify: `src/app/players/CSVImporter.tsx`

Note: `src/app/players/page.tsx` has no styling — no changes needed.

- [ ] **Step 1: Replace PlayerList.tsx**

```tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'
import AddPlayerForm from './AddPlayerForm'
import CSVImporter from './CSVImporter'

interface Player {
  id: string
  name: string
  gender: 'M' | 'F'
  isGuest: boolean
  traded: boolean
}

interface PrefRow {
  playerId: string
  position: string
  tier: 'Tier1' | 'Tier2' | 'Tier3' | 'Anti'
}

interface Props {
  initialPlayers: Player[]
  prefsByPlayer: Record<string, PrefRow[]>
}

const TIER_NUM: Record<'Tier1' | 'Tier2' | 'Tier3', string> = {
  Tier1: '1',
  Tier2: '2',
  Tier3: '3',
}

function PrefBadges({ prefs }: { prefs: PrefRow[] }) {
  const tiered = prefs
    .filter((p) => p.tier !== 'Anti')
    .sort((a, b) => a.tier.localeCompare(b.tier))
  const anti = prefs.filter((p) => p.tier === 'Anti')

  if (tiered.length === 0 && anti.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {tiered.map((p) => (
        <span
          key={p.position}
          className="text-xs border border-green-300 dark:border-green-700 text-green-800 dark:text-green-300 rounded-full px-2 py-0.5"
        >
          {TIER_NUM[p.tier as 'Tier1' | 'Tier2' | 'Tier3']}: {p.position}
        </span>
      ))}
      {anti.map((p) => (
        <span
          key={p.position}
          className="text-xs border border-red-200 dark:border-red-800 text-red-400 rounded-full px-2 py-0.5 line-through"
        >
          {p.position}
        </span>
      ))}
    </div>
  )
}

export default function PlayerList({ initialPlayers, prefsByPlayer }: Props) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [showTraded, setShowTraded] = useState(false)

  const activePlayers = players.filter((p) => !p.traded)
  const tradedPlayers = players.filter((p) => p.traded)

  async function handleMarkTraded(id: string) {
    await fetch(`/api/players/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ traded: true }),
    })
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, traded: true } : p))
    )
  }

  async function handleReinstate(id: string) {
    await fetch(`/api/players/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ traded: false }),
    })
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, traded: false } : p))
    )
  }

  function handleAdd(player: Player) {
    setPlayers((prev) => [...prev, player])
  }

  return (
    <div>
      <section className="mb-10">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
          Add Player
        </h2>
        <AddPlayerForm onAdd={handleAdd} />
      </section>

      <section className="mb-10">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
          Import from CSV
        </h2>
        <CSVImporter />
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            Roster
          </h2>
          <label className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showTraded}
              onChange={(e) => setShowTraded(e.target.checked)}
              className="rounded"
            />
            Show traded players
          </label>
        </div>

        {activePlayers.length === 0 ? (
          <p className="text-zinc-400 dark:text-zinc-500 text-sm mb-4">No active players.</p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-lg overflow-hidden mb-4">
            {activePlayers.map((player) => (
              <li
                key={player.id}
                className="flex items-start justify-between px-4 py-3"
              >
                <Link href={`/players/${player.id}`} className="hover:underline">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{player.name}</span>
                    <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded px-1.5 py-0.5">
                      {player.gender}
                    </span>
                  </div>
                  <PrefBadges prefs={prefsByPlayer[player.id] ?? []} />
                </Link>
                <button
                  onClick={() => handleMarkTraded(player.id)}
                  className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-red-500 transition-colors shrink-0 ml-4 mt-0.5"
                >
                  Mark traded
                </button>
              </li>
            ))}
          </ul>
        )}

        {showTraded && (
          <>
            <h3 className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-2 mt-6">
              Traded
            </h3>
            {tradedPlayers.length === 0 ? (
              <p className="text-zinc-400 dark:text-zinc-500 text-sm">No traded players.</p>
            ) : (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-lg overflow-hidden">
                {tradedPlayers.map((player) => (
                  <li
                    key={player.id}
                    className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
                        {player.name}
                      </span>
                      <span className="text-xs bg-zinc-100 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-400 rounded px-1.5 py-0.5">
                        {player.gender}
                      </span>
                      <span className="text-xs bg-zinc-200 dark:bg-zinc-700 text-zinc-500 rounded px-1.5 py-0.5">
                        Traded
                      </span>
                    </div>
                    <button
                      onClick={() => handleReinstate(player.id)}
                      className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                    >
                      Reinstate
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Replace AddPlayerForm.tsx**

```tsx
'use client'

import { useState } from 'react'
import { ALL_POSITIONS } from '@/domain/types'
import type { Position, PreferenceTier } from '@/domain/types'

interface Player {
  id: string
  name: string
  gender: 'M' | 'F'
  isGuest: boolean
  traded: boolean
}

interface Props {
  onAdd: (player: Player) => void
}

const TIERS: (PreferenceTier | '')[] = ['', 'Tier1', 'Tier2', 'Tier3', 'Anti']

const TIER_LABELS: Record<PreferenceTier | '', string> = {
  '': '—',
  Tier1: 'T1',
  Tier2: 'T2',
  Tier3: 'T3',
  Anti: 'Anti',
}

const TIER_COLORS: Record<PreferenceTier | '', string> = {
  '': 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500',
  Tier1: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
  Tier2: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
  Tier3: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
  Anti: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
}

function buildEmptyMap() {
  const map = new Map<Position, PreferenceTier | ''>()
  for (const pos of ALL_POSITIONS) map.set(pos, '')
  return map
}

export default function AddPlayerForm({ onAdd }: Props) {
  const [name, setName] = useState('')
  const [gender, setGender] = useState<'M' | 'F'>('M')
  const [adding, setAdding] = useState(false)
  const [showPrefs, setShowPrefs] = useState(false)
  const [tierMap, setTierMap] = useState(buildEmptyMap)

  function cycleNext(pos: Position) {
    const current = tierMap.get(pos) ?? ''
    const idx = TIERS.indexOf(current)
    const next = TIERS[(idx + 1) % TIERS.length]
    setTierMap((prev) => new Map(prev).set(pos, next))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)

    const res = await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, gender }),
    })
    const player: Player = await res.json()

    const prefs = ALL_POSITIONS.flatMap((pos) => {
      const tier = tierMap.get(pos)
      return tier ? [{ position: pos, tier }] : []
    })

    if (prefs.length > 0) {
      await fetch(`/api/players/${player.id}/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      })
    }

    onAdd(player)
    setName('')
    setGender('M')
    setTierMap(buildEmptyMap())
    setShowPrefs(false)
    setAdding(false)
  }

  const inputClass = "border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex gap-3 items-end mb-3">
        <div className="flex-1">
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Player name"
            className={`w-full ${inputClass}`}
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as 'M' | 'F')}
            className={inputClass}
          >
            <option value="M">M</option>
            <option value="F">F</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={adding}
          className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-md hover:bg-zinc-700 disabled:opacity-50"
        >
          {adding ? 'Adding…' : 'Add'}
        </button>
      </div>

      <button
        type="button"
        onClick={() => setShowPrefs((v) => !v)}
        className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors mb-3"
      >
        {showPrefs ? '▲ Hide preferences' : '▼ Add preferences'}
      </button>

      {showPrefs && (
        <div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-2">Click a position to cycle its tier.</p>
          <div className="grid grid-cols-5 gap-2">
            {ALL_POSITIONS.map((pos) => {
              const tier = tierMap.get(pos) ?? ''
              return (
                <button
                  key={pos}
                  type="button"
                  onClick={() => cycleNext(pos)}
                  className={`rounded-md px-3 py-2 text-xs font-medium flex flex-col items-center gap-1 border border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors ${TIER_COLORS[tier]}`}
                >
                  <span className="font-semibold">{pos}</span>
                  <span>{TIER_LABELS[tier]}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </form>
  )
}
```

- [ ] **Step 3: Replace CSVImporter.tsx**

```tsx
'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CSVImporter() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: string[] } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const csv = await file.text()
      const res = await fetch('/api/players/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Import failed')
        return
      }

      const data = await res.json()
      setResult(data)
      router.refresh()
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-4">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
        Bulk Import via CSV
      </p>

      <label className="inline-flex items-center gap-2 cursor-pointer">
        <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-sm rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
          {loading ? 'Importing…' : 'Choose CSV file'}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="sr-only"
          disabled={loading}
          onChange={handleFileChange}
        />
      </label>

      {result && (
        <div className="mt-3 text-sm">
          <p className="text-green-700 dark:text-green-400 font-medium">
            Imported {result.imported} player{result.imported !== 1 ? 's' : ''}
          </p>
          {result.skipped.length > 0 && (
            <div className="mt-1">
              <p className="text-zinc-500 dark:text-zinc-400">
                Skipped ({result.skipped.length}):
              </p>
              <ul className="list-disc list-inside text-zinc-400 dark:text-zinc-500 text-xs mt-0.5">
                {result.skipped.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/players/PlayerList.tsx src/app/players/AddPlayerForm.tsx src/app/players/CSVImporter.tsx
git commit -m "feat: add dark mode to PlayerList, AddPlayerForm, CSVImporter"
```

---

### Task 12: Fix player detail page + PlayerEditor.tsx + PreferencesEditor.tsx

**Files:**
- Modify: `src/app/players/[id]/PlayerEditor.tsx`
- Modify: `src/app/players/[id]/PreferencesEditor.tsx`

Note: `src/app/players/[id]/page.tsx` only has `text-zinc-500 uppercase tracking-wide` section headers — update those too.

- [ ] **Step 1: Replace src/app/players/[id]/page.tsx**

```tsx
import { notFound } from 'next/navigation'
import { db } from '@/db'
import { players, positionPreferences } from '@/db/schema'
import { eq } from 'drizzle-orm'
import PlayerEditor from './PlayerEditor'
import PreferencesEditor from './PreferencesEditor'

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [player] = await db.select().from(players).where(eq(players.id, id))
  if (!player) notFound()

  const prefs = await db
    .select()
    .from(positionPreferences)
    .where(eq(positionPreferences.playerId, id))

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-8">{player.name}</h1>

      <section className="mb-10">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
          Details
        </h2>
        <PlayerEditor playerId={id} initialName={player.name} initialGender={player.gender} />
      </section>

      <section>
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
          Position Preferences
        </h2>
        <PreferencesEditor playerId={id} initialPrefs={prefs} />
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Replace PlayerEditor.tsx**

```tsx
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

  const inputClass = "border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-end">
      <div className="flex-1">
        <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setSaved(false) }}
          required
          className={`w-full ${inputClass}`}
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Gender</label>
        <select
          value={gender}
          onChange={(e) => { setGender(e.target.value as 'M' | 'F'); setSaved(false) }}
          className={inputClass}
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
```

- [ ] **Step 3: Replace PreferencesEditor.tsx**

```tsx
'use client'

import { useState } from 'react'
import { ALL_POSITIONS } from '@/domain/types'
import type { Position, PreferenceTier } from '@/domain/types'

interface PrefRow {
  playerId: string
  position: Position
  tier: PreferenceTier
}

interface Props {
  playerId: string
  initialPrefs: PrefRow[]
}

const TIERS: (PreferenceTier | '')[] = ['', 'Tier1', 'Tier2', 'Tier3', 'Anti']

const TIER_LABELS: Record<PreferenceTier | '', string> = {
  '': '—',
  Tier1: 'T1',
  Tier2: 'T2',
  Tier3: 'T3',
  Anti: 'Anti',
}

const TIER_COLORS: Record<PreferenceTier | '', string> = {
  '': 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500',
  Tier1: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
  Tier2: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
  Tier3: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
  Anti: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
}

function buildMap(prefs: PrefRow[]): Map<Position, PreferenceTier | ''> {
  const map = new Map<Position, PreferenceTier | ''>()
  for (const pos of ALL_POSITIONS) map.set(pos, '')
  for (const pref of prefs) map.set(pref.position, pref.tier)
  return map
}

export default function PreferencesEditor({ playerId, initialPrefs }: Props) {
  const [tierMap, setTierMap] = useState(() => buildMap(initialPrefs))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function cycleNext(pos: Position) {
    const current = tierMap.get(pos) ?? ''
    const idx = TIERS.indexOf(current)
    const next = TIERS[(idx + 1) % TIERS.length]
    setTierMap((prev) => new Map(prev).set(pos, next))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    const body = ALL_POSITIONS.flatMap((pos) => {
      const tier = tierMap.get(pos)
      return tier ? [{ position: pos, tier }] : []
    })
    await fetch(`/api/players/${playerId}/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    setSaved(true)
  }

  return (
    <div>
      <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-3">Click a position to cycle its tier.</p>
      <div className="grid grid-cols-5 gap-2 mb-4">
        {ALL_POSITIONS.map((pos) => {
          const tier = tierMap.get(pos) ?? ''
          return (
            <button
              key={pos}
              onClick={() => cycleNext(pos)}
              className={`rounded-md px-3 py-2 text-xs font-medium flex flex-col items-center gap-1 border border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors ${TIER_COLORS[tier]}`}
            >
              <span className="font-semibold">{pos}</span>
              <span>{TIER_LABELS[tier]}</span>
            </button>
          )
        })}
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-md hover:bg-zinc-700 disabled:opacity-50"
      >
        {saving ? 'Saving…' : saved ? 'Saved' : 'Save preferences'}
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/players/[id]/page.tsx" "src/app/players/[id]/PlayerEditor.tsx" "src/app/players/[id]/PreferencesEditor.tsx"
git commit -m "feat: add dark mode to player detail page, PlayerEditor, PreferencesEditor"
```

---

### Task 13: Final verification

- [ ] **Step 1: Run dev server and verify all pages in both modes**

```bash
npm run dev
```

Open http://localhost:3000 and verify:
1. Toggle shows moon in light mode, sun in dark mode
2. Toggle switches theme; preference persists on page reload
3. OS preference respected on first visit (clear localStorage to test)
4. Check each page: home, season, game, lineup, players, player detail
5. Verify lineup page is readable in dark mode (table borders, position badges, player picker panel)
6. Verify nav links are visible in dark mode (not too dark)
7. Verify inputs/selects are visible and contrast correctly in dark mode
8. Verify no flash of wrong theme on load (next-themes handles this via `suppressHydrationWarning`)

- [ ] **Step 2: Fix any remaining issues found during verification**

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete dark mode implementation with nav toggle"
```
