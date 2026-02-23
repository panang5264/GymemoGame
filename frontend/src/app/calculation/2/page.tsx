import * as game from '@/lib/calculation-minigame/game_logic'
import ClientPage from './client'

export default async function Page() {
  const maxNumber = 10
  const [val1, val2] = game.RandomValue(maxNumber)
  const operator = game.RandomOperator()
  return (
    <ClientPage val1={val1} val2={val2} maxNumber={maxNumber} operator={operator} />
  )
}
