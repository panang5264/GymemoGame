import Link from 'next/link'

const TOTAL_SUBLEVELS = 12
const SPECIAL_BOXES = [4, 9]

export default function VillagePage({ params }: { params: { villageId: string } }) {
  const { villageId } = params
  const sublevels = Array.from({ length: TOTAL_SUBLEVELS }, (_, i) => i + 1)

  return (
    <div className="container">
      <h1>🏘️ หมู่บ้านที่ {villageId}</h1>
      <p>เลือกด่านย่อยเพื่อเล่น</p>
      <div className="sublevel-grid">
        {sublevels.map((level) => (
          <Link
            key={level}
            href={`/world/${villageId}/sublevel/${level}`}
            className={`sublevel-box${SPECIAL_BOXES.includes(level) ? ' special' : ''}`}
          >
            {SPECIAL_BOXES.includes(level) ? '⭐' : '▶'} ด่าน {level}
          </Link>
        ))}
      </div>
      <div className="village-actions">
        <Link href="/world" className="back-link">← กลับแผนที่</Link>
      </div>
    </div>
  )
}
