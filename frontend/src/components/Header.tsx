import Link from 'next/link'

export default function Header() {
  return (
    <header className="header">
      <div className="container">
        <h1 className="logo">🧠 Gymemo</h1>
        <nav className="nav">
          <Link href="/" className="nav-link">หน้าแรก</Link>
          <Link href="/world" className="nav-link">โลก</Link>
          <Link href="/minigame" className="nav-link">มินิเกม</Link>
        </nav>
      </div>
    </header>
  )
}
