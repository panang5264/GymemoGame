'use client'
import react from 'react'
import * as game from '@/lib/calculation-minigame/game_logic'
import Timer from '@/components/Timer'

type Props = {
  val1: number,
  val2: number,
  maxNumber: number,
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

  const handleTimeUp = () => {
    setIsRunning(false)
    setIsTimeUp(true)
  }
  const showMessage = function() {
    if (answerResult === null) return;
    return answerResult ? "✅ ถูกต้อง" : "❌ ไม่ถูกต้อง"
  }
  const handleClick = function(answer: number) {
    const result = game.Calculate(answer, val1, val2, operator.name)
    setAnswerResult(result)

    // สุ่มโจทย์ใหม่และรีเซ็ตคำตอบ
    setTimeout(() => {
      const [newVal1, newVal2] = game.RandomValue(props.maxNumber)
      const newOperator = game.RandomOperator()
      setVal1(newVal1)
      setVal2(newVal2)
      setOeprator(newOperator)
      setAnswer("")
      setAnswerResult(null)
    }, 1000) // รอ 1 วินาทีเพื่อให้เห็นผลลัพธ์ก่อนสุ่มใหม่
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
      <div className='game-title flex justify-center'>
        {val1} {operator.name} {val2}
      </div>
      <div className='flex justify-center mt-20'>
        <label className='game-title'>
          Answer: <input className='border-4 border-white-500'
            name="myInput"
            placeholder='type Answer here...'
            value={answer}
            disabled={isTimeUp}
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
