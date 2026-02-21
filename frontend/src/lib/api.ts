const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001'

export async function getProgression(guestId: string) {
  const res = await fetch(`${API_BASE_URL}/api/progression/${guestId}`)
  if (!res.ok) throw new Error('Failed to fetch progression')
  return res.json()
}

export async function completeSubLevel(
  guestId: string,
  villageId: number,
  subLevelId: number
) {
  const res = await fetch(`${API_BASE_URL}/api/progression/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guestId, villageId, subLevelId }),
  })
  if (!res.ok) throw new Error('Failed to complete sublevel')
  return res.json()
}

export async function unlockVillage(guestId: string, villageId: number) {
  const res = await fetch(`${API_BASE_URL}/api/progression/unlock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guestId, villageId }),
  })
  if (!res.ok) throw new Error('Failed to unlock village')
  return res.json()
}
