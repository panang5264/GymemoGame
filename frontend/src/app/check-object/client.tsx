'use client'
import * as react from 'react'
import Image from "next/image"
import * as game from './game_logic'

type Property = {
  question: game.Question
}

export default function ClientPage({ question }: Property) {
  const [answerResult, setAnswerResult] = react.useState<boolean | null>(null);
  const [q, setNewQuestion] = react.useState<game.Question>(question)

  const showMessage = function() {
    if (answerResult === null) return;
    return answerResult ? "✅ ถูกต้อง" : "❌ ไม่ถูกต้อง"
  }
  const nextQuestion = function() {
    setNewQuestion(game.random_question())
  }
  return (
    <div className='mb-10'>
      <div className='flex justify-center'>
        <Image
          src={"/assets/CheckObject/image1.png"}
          width={500}
          height={500}
          alt={''}
        />
      </div>
      <div className='flex justify-center'>
        {showMessage()}
      </div>
      <div className='flex justify-center game-title'>
        ในรูปนี้มี {q.text} ไหม?
      </div>
      <div className='flex justify-center gap-10'>
        <button className='cta-button'
          onClick={function() {
            const result = game.checkAnswer(q, true);
            setAnswerResult(result)
            nextQuestion()
          }}
        >
          Yes
        </button>
        <button className='cta-button'
          onClick={function() {
            const result = game.checkAnswer(q, false);
            setAnswerResult(result)
            nextQuestion()
          }}
        >
          No
        </button>
      </div>
    </div>
  )
}
