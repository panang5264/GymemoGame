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

// --- Auth API ---

export async function loginUser(phone: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Failed to login')
  return data
}

export async function registerUser(name: string, phone: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Failed to register')
  return data
}

export async function getUserProfile(token: string) {
  const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Failed to fetch profile')
  return data
}
