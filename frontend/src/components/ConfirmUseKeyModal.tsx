'use client'

import { useEffect } from 'react'

type Props = {
  open: boolean
  keysLeft: number
  cost?: number
  title?: string
  villageId?: number
  onCancel: () => void
  onConfirm: () => void
  onPlay?: () => void
}

export default function ConfirmUseKeyModal({
  open,
  keysLeft,
  cost = 1,
  title = 'เล่นฟรี หรือ ใช้กุญแจข้ามด่าน?',
  villageId = 1,
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
      className="fixed inset-0 z-[9999] bg-[#1a1a1a]/80 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto"
    >
      <div className="friendly-card w-full max-w-[600px] animate-in zoom-in duration-300 relative my-auto mt-20 mb-10 md:mt-auto md:mb-auto">
        <div className="flex justify-between items-start gap-4 mb-6 md:mb-8">
          <h3 className="text-2xl md:text-3xl font-black text-[#000000] uppercase tracking-tight leading-tight">
            {title}
          </h3>
          <button
            onClick={onCancel}
            className="w-10 h-10 md:w-12 md:h-12 border-2 border-[#000000] bg-[var(--card-bg)] rounded-xl flex items-center justify-center font-black text-[#000000] text-lg md:text-xl hover:bg-red-500 hover:text-white transition-all shadow-[2px_2px_0_#000] shrink-0"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 mb-8 bg-[#000000]/5 p-5 md:p-6 rounded-2xl md:rounded-[2rem] border-2 border-dashed border-[#000000]/10">
          <div className="flex justify-between items-center font-bold text-[#000000] text-base md:text-xl">
            <span>ต้องใช้กุญแจ:</span>
            <span className="font-black border-b-2 border-[#000000] pb-1">{cost} ดอก</span>
          </div>
          <div className="flex justify-between items-center font-bold text-[#000000] text-base md:text-xl">
            <span>กุญแจคงเหลือ:</span>
            <span className="font-black">{keysLeft} ดอก</span>
          </div>

          <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-[#000000]/10">
            <p className="text-xs md:text-sm text-indigo-700 font-black tracking-wide leading-relaxed bg-indigo-50 px-4 md:px-5 py-3 md:py-4 rounded-xl md:rounded-2xl border-2 border-indigo-100 shadow-sm flex gap-3 items-start">
              <span className="text-lg md:text-xl scale-125 pt-0.5">💡</span>
              <span>เล่นเองจะได้รับโบนัสคะแนนเพิ่ม <span className="underline decoration-indigo-300 underline-offset-4">{keysLeft * 10 * villageId} แต้ม!</span> (โบนัสคูณระดับความยาก)</span>
            </p>
            <p className="text-xs md:text-sm text-red-600 font-black tracking-wide leading-relaxed bg-red-50 px-4 md:px-5 py-3 md:py-4 rounded-xl md:rounded-2xl border-2 border-red-100 shadow-sm flex gap-3 items-start">
              <span className="text-lg md:text-xl scale-125 pt-0.5">⚠️</span>
              <span>หากใช้กุญแจข้ามด่าน จะไม่ได้รับคะแนน และเสียกุญแจ <span className="underline decoration-red-400 underline-offset-4">{cost} ดอก</span></span>
            </p>
          </div>
        </div>

        {!canPay && (
          <div className="mb-6 md:mb-8 p-4 md:p-5 rounded-2xl border-2 border-red-500 bg-red-50 text-red-600 font-black text-center text-sm md:text-base animate-pulse shadow-sm">
            ❌ กุญแจไม่เพียงพอ กรุณารอรีเจนใหม่
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          {onPlay && (
            <button
              onClick={onPlay}
              className="py-4 md:py-5 px-4 bg-[#4ade80] border-3 border-[#000000] rounded-2xl md:rounded-[1.5rem] font-black text-[#000000] text-sm md:text-base uppercase shadow-[4px_4px_0_#000] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] transition-all flex items-center justify-center gap-2"
            >
              <span className="text-lg md:text-xl">▶</span> เล่นด่านนี้ (ฟรี)
            </button>
          )}

          <button
            onClick={() => {
              if (!canPay) return
              onConfirm()
            }}
            disabled={!canPay}
            className={`py-4 md:py-5 px-4 border-3 border-[#000000] rounded-2xl md:rounded-[1.5rem] font-black text-sm md:text-base uppercase transition-all flex items-center justify-center gap-2
              ${canPay
                ? 'bg-yellow-400 text-[#000000] shadow-[4px_4px_0_#000] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50'
              }
            `}
          >
            <span className="text-lg md:text-xl">⏭</span> ใช้ข้ามด่าน ({cost})
          </button>

          <button
            onClick={onCancel}
            className="sm:col-span-2 py-3 md:py-4 text-[#555555] font-black text-xs md:text-sm uppercase tracking-widest hover:text-red-600 transition-all mt-2 md:mt-3"
          >
            ยกเลิกและปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  )
}