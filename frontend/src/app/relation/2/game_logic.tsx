export const question_list: string[] = ["ภาพที่มีเด็ก", "ภาพที่มีกรอบรูป", "ภาพที่มีโคมไฟ"]

export const leftCorrectAnswer = new Set(["ภาพที่มีเด็ก", "ภาพที่มีกรอบรูป"])
export const rightCorrectAnswer = new Set(["ภาพที่มีโคมไฟ"])

export function random_question(): string {
  return question_list[Math.floor(Math.random() * question_list.length)]
}
export function checkAnswer(answer: string, cur_question: string): boolean {
  switch (answer) {
    case "left":
      return leftCorrectAnswer.has(cur_question)
    case "right":
      return rightCorrectAnswer.has(cur_question)
    default:
      return false
  }
}
