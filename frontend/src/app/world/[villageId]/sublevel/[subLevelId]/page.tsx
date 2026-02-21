import { redirect, notFound } from 'next/navigation'

const MINIGAMES = ['/minigame/memory', '/minigame/spatial']

export default function SubLevelPage({
  params,
}: {
  params: { villageId: string; subLevelId: string }
}) {
  const subLevelNum = parseInt(params.subLevelId, 10)
  if (isNaN(subLevelNum) || subLevelNum < 1) {
    notFound()
  }
  const index = (subLevelNum - 1) % MINIGAMES.length
  redirect(MINIGAMES[index])
}
