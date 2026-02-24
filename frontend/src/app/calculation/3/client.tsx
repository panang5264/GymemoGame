'use client'
import Image from 'next/image'
import * as game from '@/lib/calculation-minigame/game_logic'
import * as react from 'react'
import Timer from "@/components/Timer"

type Props = {
  values: game.Operand[]
  operators: game.Operator[]
  maxNumber: number
  max_value: number
  max_operator: number
}
export default function ClientPage(props: Props) {
  const [values, setValues] = react.useState(props.values)
  const [operators, setOperator] = react.useState(props.operators)
  const [answer, setAnswer] = react.useState("")
  const [answerResult, setAnswerResult] = react.useState<boolean | null>(null)
  const [isTimeUp, setIsTimeUp] = react.useState(false)
  const [isRunning, setIsRunning] = react.useState(true)

  const showMessage = function() {
    if (answerResult === null) return;
    return answerResult ? "✅ ถูกต้อง" : "❌ ไม่ถูกต้อง"
  }
  const handleClick = function(answer: number) {
    const [_,result] = game.Calculate({ answer: answer, operands: values, operators: operators })
    setAnswerResult(result)

    // สุ่มโจทย์ใหม่และรีเซ็ตคำตอบ
    setTimeout(() => {
      const v = []
      const operator = []
      for (let i = 0; i < props.max_value; i++) {
        v.push(game.Random(props.maxNumber))
      }

      for (let i = 0; i < props.max_operator; i++) {
        operator.push(game.RandomOperator())
      }
      setValues(v)
      setOperator(operator)
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
      <div className='flex justify-center justify-items-center gap-4 mt-10'>
        {values.map((value, index) => (
          <react.Fragment key={index}>
            {typeof value === 'number' ? (
              <div className='game-title'>
                {value}
              </div>
            ) : (
              <Image
                src={value.path}
                width={75}
                height={50}
                style={{ width: 'auto', height: 'auto' }}
                alt={value.name}
              />
            )}
            {index < operators.length && (
              <div className='game-title'>
                {operators[index].name}
              </div>
            )}
          </react.Fragment>
        ))}
      </div>
      <div className='flex justify-center mt-20'>
        <label className='game-title'>
          Answer: <input className='border-4 border-white-500'
            name="myInput"
            placeholder='type Answer here...'
            value={answer}
            disabled={isTimeUp}
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
