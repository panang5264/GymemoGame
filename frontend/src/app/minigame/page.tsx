import Link from 'next/link'

export default function MinigamePage() {
  return (
    <div className="container">
      <h1>🎮 มินิเกม</h1>
      <ul>
        <li>
          <Link href="/minigame/Management">📦 Management</Link>
        </li>
        <li>
          <Link href="/minigame/spatial">🗺️ Spatial – จับคู่ความสัมพันธ์</Link>
        </li>
        <li>
          <span>🔢 Calculation – เร็วๆ นี้</span>
        </li>
      </ul>
    </div>
  )
}
