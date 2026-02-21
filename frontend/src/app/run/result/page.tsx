import Link from 'next/link'

export default function RunResultPage() {
  return (
    <div className="container">
      <h1>🎉 ผลลัพธ์</h1>
      <p>ยินดีด้วย! คุณทำภารกิจสำเร็จแล้ว</p>
      <div className="result-actions">
        <Link href="/world" className="cta-button">กลับแผนที่ 🗺️</Link>
        <Link href="/minigame" className="cta-button">มินิเกมอื่น 🎮</Link>
      </div>
    </div>
  )
}
