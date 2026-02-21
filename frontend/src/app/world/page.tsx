import Link from 'next/link'

const VILLAGES = [
  { id: '1', name: 'หมู่บ้านที่ 1' },
  { id: '2', name: 'หมู่บ้านที่ 2' },
  { id: '3', name: 'หมู่บ้านที่ 3' },
]

export default function WorldPage() {
  return (
    <div className="container">
      <h1>🗺️ แผนที่โลก</h1>
      <p>เลือกหมู่บ้านเพื่อเริ่มการผจญภัย</p>
      <div className="village-list">
        {VILLAGES.map((village) => (
          <Link key={village.id} href={`/world/${village.id}`} className="village-card">
            🏘️ {village.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
