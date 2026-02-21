import Link from 'next/link'

export default function Header() {
  return (
    <header className="header">
      <div className="container">
        <h1 className="logo">🧠 Gymemo</h1>
        <nav className="nav">
          <Link href="/" className="nav-link">หน้าแรก</Link>

          <Link href="/world" className="nav-link">🗺️ แผนที่หมู่บ้าน</Link>

          <Link href="/daily-challenge" className="nav-link">🌟 ภารกิจรายวัน</Link>
        </nav>
      </div>
    </header>
  )
}