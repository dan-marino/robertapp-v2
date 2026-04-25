import { generateLineupForGame } from '@/lib/generateLineupForGame'

/**
 * Re-runs the Lineup Generator with a fresh random seed (the engines
 * already use Math.random() for tiebreaks via shuffle()), replacing the
 * currently saved Lineup. Uses the same saved RSVPs and history as the
 * original generation — does not re-prompt for attendance.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params

  const result = await generateLineupForGame(gameId)

  if (result === null) return Response.json({ error: 'Game not found' }, { status: 404 })
  if (result === 'no-active-players') {
    return Response.json({ error: 'No active players for this game' }, { status: 422 })
  }

  return Response.json(result)
}
