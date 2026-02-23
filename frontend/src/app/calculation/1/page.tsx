import ClientPage from './client'
import * as game from '@/lib/calculation-minigame/game_logic'
export default async function Page() {
  const [val1, val2] = game.RandomDice()
  const operator = game.RandomOperator()
  return (
    <ClientPage val1={val1} val2={val2} operator={operator} />
  )
}
