'use client'

import { useEffect } from 'react'

type Props = {
  open: boolean
  keysLeft: number
  cost?: number
  title?: string
  onCancel: () => void
  onConfirm: () => void
  onPlay?: () => void // เพิ่ม: เล่นแบบไม่ใช้กุญแจ
}

export default function ConfirmUseKeyModal({
  open,
  keysLeft,
  cost = 1,
  title = 'ใช้กุญแจเพื่อเริ่มเล่น?',
  onCancel,
  onConfirm,
  onPlay,
}: Props) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  const canPay = keysLeft >= cost

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Confirm use key"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.45)',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          width: 'min(520px, 96vw)',
          background: '#F6EADB',
          border: '3px solid #1b1b1b',
          borderRadius: 18,
          padding: 16,
          boxShadow: '0 14px 0 rgba(27,27,27,0.12)',
          color: '#111',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <h3
            style={{
              margin: 0,
              fontWeight: 1000,
              letterSpacing: 0.2,
              color: '#0F0F0F',
              textShadow: '0 1px 0 rgba(255,255,255,0.65)', // ทำให้หัวข้อคมขึ้น
            }}
          >
            {title}
          </h3>
          <button
            onClick={onCancel}
            style={{
              border: '2px solid #1b1b1b',
              background: '#fff',
              borderRadius: 12,
              padding: '6px 10px',
              cursor: 'pointer',
              fontWeight: 900,
              color: '#111',
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div style={{ marginTop: 12, fontWeight: 800, lineHeight: 1.5, color: '#1a1a1a' }}>
          <div>
            ต้องใช้กุญแจ: <b style={{ color: '#000' }}>{cost}</b> ดอก
          </div>
          <div>
            กุญแจคงเหลือ: <b style={{ color: '#000' }}>{keysLeft}</b> ดอก
          </div>
        </div>

        {!canPay ? (
          <div
            style={{
              marginTop: 12,
              padding: 10,
              borderRadius: 12,
              border: '2px dashed #1b1b1b',
              background: 'rgba(255,255,255,0.75)',
              fontWeight: 900,
              color: '#111',
            }}
          >
            กุญแจไม่พอ กรุณารอให้ฟื้นฟู
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          <button
            onClick={onCancel}
            style={{
              border: '2px solid #1b1b1b',
              background: '#fff',
              borderRadius: 14,
              padding: '10px 14px',
              cursor: 'pointer',
              fontWeight: 900,
              color: '#111',
            }}
          >
            ยกเลิก
          </button>

          {/* เพิ่มปุ่ม "เล่น" (ไม่ใช้กุญแจ) */}
          {onPlay ? (
            <button
              onClick={onPlay}
              style={{
                border: '2px solid #1b1b1b',
                background: '#FFD34D', // สีเหลืองให้เป็นทางเลือกที่เด่นแต่ไม่เท่าปุ่มหลัก
                borderRadius: 14,
                padding: '10px 14px',
                cursor: 'pointer',
                fontWeight: 1000,
                color: '#111',
              }}
            >
              เล่น (ไม่ใช้กุญแจ)
            </button>
          ) : null}

          <button
            onClick={() => {
              if (!canPay) return
              onConfirm()
            }}
            disabled={!canPay}
            style={{
              border: '2px solid #1b1b1b',
              background: canPay ? '#FF6B8B' : '#ddd',
              borderRadius: 14,
              padding: '10px 14px',
              cursor: canPay ? 'pointer' : 'not-allowed',
              fontWeight: 1000,
              color: canPay ? '#111' : '#666', // ให้ตัวอักษรชัด
              textShadow: canPay ? '0 1px 0 rgba(255,255,255,0.25)' : 'none',
            }}
          >
            กดใช้กุญแจ ({cost})
          </button>
        </div>
      </div>
    </div>
  )
}