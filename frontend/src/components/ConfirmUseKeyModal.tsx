'use client'

import { useEffect } from 'react'

type Props = {
  open: boolean
  keysLeft: number
  cost?: number
  title?: string
  onCancel: () => void
  onConfirm: () => void
}

export default function ConfirmUseKeyModal({
  open,
  keysLeft,
  cost = 1,
  title = 'ใช้กุญแจเพื่อเริ่มเล่น?',
  onCancel,
  onConfirm,
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
        // click outside to close
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
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <h3 style={{ margin: 0, fontWeight: 900 }}>{title}</h3>
          <button
            onClick={onCancel}
            style={{
              border: '2px solid #1b1b1b',
              background: '#fff',
              borderRadius: 12,
              padding: '6px 10px',
              cursor: 'pointer',
              fontWeight: 900,
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div style={{ marginTop: 12, fontWeight: 800, lineHeight: 1.5 }}>
          <div>ต้องใช้กุญแจ: <b>{cost}</b> ดอก</div>
          <div>กุญแจคงเหลือ: <b>{keysLeft}</b> ดอก</div>
        </div>

        {!canPay ? (
          <div
            style={{
              marginTop: 12,
              padding: 10,
              borderRadius: 12,
              border: '2px dashed #1b1b1b',
              background: 'rgba(255,255,255,0.65)',
              fontWeight: 900,
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
            }}
          >
            ยกเลิก
          </button>

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
              fontWeight: 900,
            }}
          >
            กดใช้กุญแจ ({cost})
          </button>
        </div>
      </div>
    </div>
  )
}