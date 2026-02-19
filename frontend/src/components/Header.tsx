import Link from 'next/link'

export default function Header() {
  return (
    <header className="header">
      <div className="container">
        <h1 className="logo">🧠 Gymemo</h1>
        <nav className="nav">
          <Link href="/" className="nav-link">หน้าแรก</Link>
          <Link href="/game" className="nav-link">เล่นเกม</Link>
        </nav>
      </div>
    </header>
  )
}
