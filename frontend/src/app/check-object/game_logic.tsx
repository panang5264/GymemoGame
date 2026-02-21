export type Question = {
  text: string
  is_correct: boolean
}

const question_list: Question[] = [
  { text: "มีร่ม 3 คัน", is_correct: true },
  { text: "มีร่ม 2 คัน", is_correct: false },
  { text: "มีคน", is_correct: true },
]


export function random_question(): Question {
  const index = Math.floor(Math.random() * question_list.length)
  return question_list[index]
}

export function checkAnswer(question: Question, answer: boolean): boolean {
  return question.is_correct === answer
  // return true;
}

