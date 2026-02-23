'use client'

import Image from 'next/image'
import react from 'react'
import * as game from '@/lib/calculation-minigame/game_logic'
import Timer from '@/components/Timer'

type Props = {
  val1: game.Dice,
  val2: game.Dice,
  operator: game.Operator,
}

export default function ClientPage(props: Props) {
  const [val1, setVal1] = react.useState(props.val1)
  const [val2, setVal2] = react.useState(props.val2)
  const [operator, setOeprator] = react.useState(props.operator)
  const [answer, setAnswer] = react.useState("")
  const [answerResult, setAnswerResult] = react.useState<boolean | null>(null)
  const [isTimeUp, setIsTimeUp] = react.useState(false)
  const [isRunning, setIsRunning] = react.useState(true)

  const showMessage = function() {
    if (answerResult === null) return;
    return answerResult ? "✅ ถูกต้อง" : "❌ ไม่ถูกต้อง"
  }
  const handleClick = function(answer: number) {
    const result = game.Calculate(answer, val1.value, val2.value, operator.name)
    setAnswerResult(result)

    // สุ่มโจทย์ใหม่และรีเซ็ตคำตอบ
    setTimeout(() => {
      const [newVal1, newVal2] = game.RandomDice()
      const newOperator = game.RandomOperator()
      setVal1(newVal1)
      setVal2(newVal2)
      setOeprator(newOperator)
      setAnswer("")
      setAnswerResult(null)
    }, 1000) // รอ 1 วินาทีเพื่อให้เห็นผลลัพธ์ก่อนสุ่มใหม่
  }
  const handleTimeUp = () => {
    setIsTimeUp(true)
    setIsRunning(false)
  }
  return (
    <div>
      <div className='flex justify-center mb-5'>
        <Timer isRunning={isRunning} initialSeconds={60} onTimeUp={handleTimeUp} />
      </div>
      {isTimeUp && (
        <div className='flex justify-center mb-5'>
          <p className='text-red-500 font-bold text-xl'>⏰ หมดเวลา! ไม่สามารถเลือกได้แล้ว</p>
        </div>
      )}
      <div className='flex justify-center justify-items-center grid grid-cols-3'>
        <Image
          src={val1.path}
          width={150}
          height={150}
          alt={''}
        />
        <Image
          src={operator.path}
          width={150}
          height={150}
          alt={''}
        />
        <Image
          src={val2.path}
          width={150}
          height={150}
          alt={''}
        />
      </div>
      <div className='flex justify-center mt-20'>
        <label className='game-title'>
          Answer: <input className='border-4 border-white-500'
            name="myInput"
            placeholder='type Answer here...'
            value={answer}
            disabled={isTimeUp}
            onKeyDown={
              (event)=>{
                if(event.key === 'Enter') {
                  if (isTimeUp) return
                  const parsed = Number(answer)
                  if (isNaN(parsed)) return
                  handleClick(parsed)
                }
              }
            }
            onChange={(e) => setAnswer(e.target.value)}
            style={{ opacity: isTimeUp ? 0.5 : 1 }}
          />
          <button className='cta-button'
            disabled={isTimeUp}
            onClick={() => {
              if (isTimeUp) return
              const parsed = Number(answer)
              if (isNaN(parsed)) return
              handleClick(parsed)
            }}
            onKeyDown={
              (event) => {
                if (event.key === 'Enter') {
                  if (isTimeUp) return
                  const parsed = Number(answer)
                  if (isNaN(parsed)) return
                  handleClick(parsed)
                }
              }
            }
            style={{ opacity: isTimeUp ? 0.5 : 1, cursor: isTimeUp ? 'not-allowed' : 'pointer' }}
          >
            Yes
          </button>
        </label>
      </div>
      <div className="flex justify-center mt-10">
        {showMessage()}
      </div>
    </div>
  )
}
