import * as game from '@/lib/calculation-minigame/game_logic'
import ClientPage from './client'
export default async function Page() {
  const val1 = game.Random(10)
  const val2 = game.Random(10)
  const val3 = game.Random(10)

  const operator1 = game.RandomOperator()
  const operator2 = game.RandomOperator()

  return (
    <ClientPage values={[val1, val2, val3]} operators={[operator1, operator2]} max_value={3} max_operator={2} maxNumber={10} />
  )
}
