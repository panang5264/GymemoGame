import Link from 'next/link'

export default function MinigamePage() {
  return (
    <div className="container">
      <h1>🎮 มินิเกม</h1>
      <ul>
        <li>
          <Link href="/minigame/management">📦 Management</Link>
        </li>
        <li>
          <Link href="/minigame/spatial">🗺️ Spatial – จับคู่ความสัมพันธ์</Link>
        </li>
        <li>
          <Link href="/minigame/calculation">🔢 Calculation – โหมดคำนวณ</Link>
        </li>
        <li>
          <Link href="/minigame/reaction">🧭 Maze Runner — ทดสอบการวางแผน</Link>
        </li>
      </ul>
    </div>
  )
}
