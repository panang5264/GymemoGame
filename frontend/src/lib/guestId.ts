const GUEST_ID_KEY = 'gymemo_guest_id'

function generateId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

export function getGuestId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(GUEST_ID_KEY)
  if (!id) {
    id = generateId()
    localStorage.setItem(GUEST_ID_KEY, id)
  }
  return id
}
