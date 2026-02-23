'use client'
import Image from "next/image"
import react from "react"

type Props = {
  items: string[]
  question: string
  path: string
  answer: Set<string>
}

export default function({ path, items, question, answer }: Props) {
  const [selected, setSelected] = react.useState<string[]>([])
  const [answerResult, setAnswerResult] = react.useState<boolean | null>(null)
  const checkAnswer = function() {
    setAnswerResult(true)
    if (selected.length !== answer.size) {
      setAnswerResult(false)
      return
    }
    for (const i of selected) {
      const name = i.split(".")[0]
      if (!answer.has(name)) {
        setAnswerResult(false)
        break;
      }
    }
  }

  const showMessage = function() {
    if (answerResult === null) return;
    return answerResult ? "✅ ถูกต้อง" : "❌ ไม่ถูกต้อง"
  }
  return (
    <div>
      <div className="game-title flex justify-center">
        {question}
      </div>
      <div className="flex justify-center justify-items-center grid grid-cols-4 grid-rows-4">
        {items.map((name) => (
          <Image className={`border-4 ${selected.includes(name) ? "border-red-500" : "border-transparent"}`}
            onClick={() => {
              setSelected(prev =>
                prev.includes(name)
                  ? prev.filter(n => n !== name)
                  : [...prev, name]
              )
            }}
            key={name}
            src={path + name}
            width={50}
            height={50}
            alt={""} />
        ))}
      </div>
      <div className="flex justify-center">
        <button className="cta-button"
          onClick={() => checkAnswer()}
        >
          Yes
        </button>
      </div>
      <div className="flex justify-center mt-10">
        {showMessage()}
      </div>
    </div>
  )
}
