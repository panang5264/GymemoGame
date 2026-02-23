import ClientPage from './client'
import * as game from '@/lib/calculation-minigame/calculation_logic'
export default async function Page() {
  const [val1, val2] = game.RandomValue()
  const operator = game.RandomOperator()
  return (
    <ClientPage val1={val1} val2={val2} operator={operator} />
  )
}
