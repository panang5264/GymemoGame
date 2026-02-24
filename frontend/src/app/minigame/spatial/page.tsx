'use client'

import Image from 'next/image'
import { useState, useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { recordPlay } from '@/lib/levelSystem'

export default function Page() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const levelParam = parseInt(searchParams.get('level') || '1', 10)
  const subId = parseInt(searchParams.get('subId') || '1', 10)
  const villageId = parseInt(searchParams.get('villageId') || '1', 10)
  const mode = searchParams.get('mode')

  const levelTexts = [
    'จับคู่รอยแหว่งกับชิ้นส่วน 1',
    'จับคู่รอยแหว่งกับชิ้นส่วน 2',
    'เลือกภาพที่ต้นไม้อยู่หลังเก้าอี้',
    'เลือกภาพที่แก้วกาแฟอยู่ใต้โต๊ะ',
    'เลือกสิ่งของที่ใช้กับทะเล',
    'เลือกของใช้ในห้องน้ำ (คล้ายกันมากขึ้น)',
    'เลือกเครื่องใช้ในครัว (โทนสีเดียวกัน, มีซ้ำ)',
    'ทายวัตถุจากภาพเงาซ้อนกัน (4 ชิ้น)',
    'ทายวัตถุจากภาพเงาซ้อนกัน (6 ชิ้น)',
    'ทายวัตถุจากภาพเงาซ้อนกัน (ซับซ้อนขึ้น)'
  ]
  const diffDesc = levelTexts[Math.min(Math.max(levelParam - 1, 0), 9)]

  const [leftImages, setLeftImages] = useState<string[]>([])
  const [rightImages, setRightImages] = useState<string[]>([])
  const [matches, setMatches] = useState<Record<string, string>>({})
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)

  const isComplete = leftImages.length > 0 && Object.keys(matches).length === leftImages.length

  useEffect(() => {
    // กำหนด mock data ล่วงหน้าสำหรับ level 1-10 เป็นแนวทาง (Placeholder)
    switch (levelParam) {
      case 1:
        setLeftImages(['left1.PNG', 'left2.PNG', 'left3.PNG', 'left4.PNG', 'left5.PNG'])
        setRightImages(['right1.PNG', 'right2.PNG', 'right3.PNG', 'right4.PNG', 'right5.PNG'])
        break
      case 2:
        // ดึงภาพจากโฟลเดอร์ level2/... (ใช้ภาพ level1 แทนชั่วคราวเพื่อไม่ให้เว็บพัง)
        setLeftImages(['left1.PNG', 'left2.PNG', 'left3.PNG'])
        setRightImages(['right1.PNG', 'right2.PNG', 'right3.PNG'])
        break
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
      case 8:
      case 9:
      case 10:
      default:
        // Placeholder สำหรับระดับความยาก 3 - 10 
        setLeftImages(['left1.PNG', 'left2.PNG'])
        setRightImages(['right1.PNG', 'right2.PNG'])
        break
    }
  }, [levelParam])

  useEffect(() => {
    if (isComplete && mode === 'village') {
      recordPlay(villageId, 100)
    }
  }, [isComplete, mode, villageId])

  const handleLeftClick = (name: string) => {
    if (!matches[name]) setSelectedLeft(name)
  }

  const handleRightClick = (rightName: string) => {
    if (selectedLeft) {
      setMatches(prev => ({ ...prev, [selectedLeft]: rightName }))
      setSelectedLeft(null)
    }
  }

  return (
    <div className='game-page pt-10'>
      <h1 className="game-title">🗺️ Spatial — ด่าน {subId}</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: '#ffd700' }}>
        ระดับความยาก {levelParam}: {diffDesc}
      </p>

      {!isComplete && (
        <p style={{ opacity: 0.8, marginBottom: '1rem' }}>
          คลิกที่รูปฝั่งซ้าย แล้วคลิกรูปฝั่งขวาเพื่อจับคู่
        </p>
      )}

      {isComplete ? (
        <div className="dc-card">
          <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🏆</div>
          <h2>เก่งมาก! จับคู่ครบแล้ว</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', marginTop: '2rem' }}>
            {subId < 12 ? (
              <button
                className="start-button"
                style={{ marginBottom: 0 }}
                onClick={() => router.push(`/world/${villageId}/sublevel/${subId + 1}`)}
              >
                ด่านต่อไป 🚀
              </button>
            ) : villageId < 10 ? (
              <button
                className="start-button"
                style={{ marginBottom: 0, background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                onClick={() => router.push(`/world/${villageId + 1}`)}
              >
                หมู่บ้านถัดไป 🏘️
              </button>
            ) : null}
            <button
              className="start-button"
              style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', marginBottom: 0, marginTop: (subId < 12 || villageId < 10) ? '1rem' : 0 }}
              onClick={() => router.push(`/world/${villageId}`)}
            >
              กลับสู่แผนที่ 🗺️
            </button>
          </div>
        </div>
      ) : (
        <div className='flex justify-center gap-12 mt-6 mb-10'>
          {/* ฝั่งซ้าย */}
          <div className="flex flex-col gap-4 pr-5">
            {leftImages.map(function (name) {
              const matchedTo = matches[name]
              const isSelected = selectedLeft === name
              return (
                <div
                  key={name}
                  onClick={() => handleLeftClick(name)}
                  style={{
                    border: isSelected ? '4px solid #ffd700' : matchedTo ? '4px solid #4ade80' : '4px solid transparent',
                    borderRadius: '12px',
                    cursor: matchedTo ? 'default' : 'pointer',
                    opacity: matchedTo ? 0.5 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  <Image
                    src={`/assets/level1/relation1-1/${name}`}
                    alt={name}
                    width={120}
                    height={120}
                    className="rounded-lg bg-white/10"
                  />
                </div>
              )
            })}
          </div>

          {/* ฝั่งขวา */}
          <div className="flex flex-col gap-4 pl-5">
            {rightImages.map(function (name) {
              const isMatched = Object.values(matches).includes(name)
              return (
                <div
                  key={name}
                  onClick={() => handleRightClick(name)}
                  style={{
                    border: isMatched ? '4px solid #4ade80' : '4px solid transparent',
                    borderRadius: '12px',
                    cursor: selectedLeft && !isMatched ? 'pointer' : 'default',
                    opacity: isMatched ? 0.5 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  <Image
                    src={`/assets/level1/relation1-1/${name}`}
                    alt={name}
                    width={120}
                    height={120}
                    className="rounded-lg bg-white/10"
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  );
}
