import ClientPage from './client'
import { random_question } from './game_logic'


export default function Page() {
  const question = random_question()
  return (
    <ClientPage question={question} />
  )
}
