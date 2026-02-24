import * as game from './game_logic'
import ClientPage from './client'

export default async function Page() {
  let [items, category] = await game.getImages(1)
  if (category === undefined) {
    throw Error("category is undefined")
  }

  return (
    <ClientPage answer={category.items} path={category.path + "/"} items={items} question={category.question} />
  )
}
