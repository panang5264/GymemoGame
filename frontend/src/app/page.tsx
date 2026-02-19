import Link from 'next/link'

export default function Home() {
  return (
    <div className="home-page">
      <section className="hero">
        <h1 className="hero-title">🧠 Gymemo Game</h1>
        <p className="hero-subtitle">เกมฝึกสมองและความจำ</p>
        <p className="hero-description">
          ท้าทายความจำของคุณด้วยเกมจับคู่การ์ด พัฒนาสมองและความจำให้แข็งแรง
        </p>
        <Link href="/game" className="cta-button">
          เริ่มเล่นเกม 🎮
        </Link>
      </section>

      <section className="features">
        <div className="feature-card">
          <div className="feature-icon">🧩</div>
          <h3 className="feature-title">ฝึกความจำ</h3>
          <p className="feature-description">
            จับคู่การ์ดที่เหมือนกันเพื่อฝึกพัฒนาความจำระยะสั้น
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">⏱️</div>
          <h3 className="feature-title">ท้าทายเวลา</h3>
          <p className="feature-description">
            แข่งกับเวลาและจำนวนครั้งที่เปิดการ์ดเพื่อคะแนนที่ดีที่สุด
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3 className="feature-title">บันทึกสถิติ</h3>
          <p className="feature-description">
            บันทึกผลคะแนนและดูอันดับของคุณในกระดานผู้นำ
          </p>
        </div>
      </section>
    </div>
  )
}
