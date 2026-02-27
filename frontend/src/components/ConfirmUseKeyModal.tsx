'use client'

import { useEffect } from 'react'

type Props = {
  open: boolean
  keysLeft: number
  cost?: number
  title?: string
  onCancel: () => void
  onConfirm: () => void
  onPlay?: () => void
}

export default function ConfirmUseKeyModal({
  open,
  keysLeft,
  cost = 1,
  title = 'เล่นฟรี หรือ ใช้กุญแจข้ามด่าน?',
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
      className="fixed inset-0 z-[9999] bg-[#1a1a1a]/80 backdrop-blur-sm grid place-items-center p-4"
    >
      <div className="friendly-card w-full max-w-[500px] animate-in zoom-in duration-300">
        <div className="flex justify-between items-start gap-4 mb-6">
          <h3 className="text-2xl font-black text-[#000000] uppercase tracking-tight">
            {title}
          </h3>
          <button
            onClick={onCancel}
            className="w-10 h-10 border-2 border-[#000000] bg-[var(--card-bg)] rounded-xl flex items-center justify-center font-black text-[#000000] hover:bg-red-500 hover:text-white transition-all shadow-[2px_2px_0_#000]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2 mb-8 bg-[#000000]/5 p-4 rounded-2xl border-2 border-dashed border-[#000000]/10">
          <div className="flex justify-between font-bold text-[#000000]">
            <span>ต้องใช้กุญแจ:</span>
            <span className="font-black underline underline-offset-4">{cost} ดอก</span>
          </div>
          <div className="flex justify-between font-bold text-[#000000]">
            <span>กุญแจคงเหลือ:</span>
            <span className="font-black">{keysLeft} ดอก</span>
          </div>
        </div>

        {!canPay && (
          <div className="mb-6 p-4 rounded-2xl border-2 border-red-500 bg-red-50 text-red-600 font-black text-center text-sm animate-pulse">
            ⚠️ กุญแจไม่เพียงพอ กรุณารอรีเจนใหม่
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {onPlay && (
            <button
              onClick={onPlay}
              className="py-4 bg-[#4ade80] border-3 border-[#000000] rounded-2xl font-black text-[#000000] text-sm uppercase shadow-[4px_4px_0_#000] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all"
            >
              ▶ เล่นด่านนี้ (ฟรี)
            </button>
          )}

          <button
            onClick={() => {
              if (!canPay) return
              onConfirm()
            }}
            disabled={!canPay}
            className={`py-4 border-3 border-[#000000] rounded-2xl font-black text-sm uppercase transition-all
              ${canPay
                ? 'bg-yellow-400 text-[#000000] shadow-[4px_4px_0_#000] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50'
              }
            `}
          >
            ⏭ ใช้ข้ามด่าน ({cost})
          </button>

          <button
            onClick={onCancel}
            className="sm:col-span-2 py-3 text-[#555555] font-black text-xs uppercase tracking-widest hover:text-red-600 transition-all mt-2"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  )
}