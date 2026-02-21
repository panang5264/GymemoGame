import ClientPage from "./client"
import * as game from "./game_logic"
export default async function() {
  const question = game.random_question()
  return (
    <ClientPage question={question} />
  )
}
