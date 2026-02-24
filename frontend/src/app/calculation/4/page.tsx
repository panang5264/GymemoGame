import * as game from '@/lib/calculation-minigame/game_logic'
import ClientPage from './client'

export default async function Page() {
  const maxNumber = 10
  const val1 = game.Random(maxNumber)
  const val2 = game.Random(maxNumber)
  const val3 = game.Random(maxNumber)
  const ope1 = game.RandomOperator()
  const ope2 = game.RandomOperator()
  const values = [val1, val2, val3]
  const operators = [ope1, ope2]
  const [_, result] = game.Calculate({ operands: values, operators: operators })
  const hide_value_index = Math.floor(Math.random() * values.length)
  return (
    <ClientPage values={values}
      operators={operators}
      maxNumber={maxNumber}
      max_value={values.length}
      max_operator={operators.length}
      real_result={result}
      hide_index={hide_value_index}
    />
  )
}
