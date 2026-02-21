const PlayerProgress = require('../models/PlayerProgress')
const KeyState = require('../models/KeyState')

const TOTAL_SUBLEVELS = 12

async function getOrCreateProgress(guestId) {
  let progress = await PlayerProgress.findOne({ guestId })
  if (!progress) {
    progress = await PlayerProgress.create({
      guestId,
      currentVillageId: 1,
      villages: [{ villageId: 1, unlocked: true, subLevels: [] }],
    })
  }
  return progress
}

async function getOrCreateKeys(guestId) {
  let keyState = await KeyState.findOne({ guestId })
  if (!keyState) {
    keyState = await KeyState.create({ guestId, keys: 9 })
  }
  return keyState
}

async function getProgression(guestId) {
  const [progress, keyState] = await Promise.all([
    getOrCreateProgress(guestId),
    getOrCreateKeys(guestId),
  ])
  return { progress, keys: keyState.keys }
}

async function completeSubLevel(guestId, villageId, subLevelId) {
  const progress = await getOrCreateProgress(guestId)

  // Only allow playing in the current village
  if (progress.currentVillageId !== villageId) {
    throw new Error('ไม่สามารถเล่นด่านนี้ได้ เล่นได้เฉพาะหมู่บ้านปัจจุบัน')
  }

  let village = progress.villages.find((v) => v.villageId === villageId)
  if (!village) {
    progress.villages.push({ villageId, unlocked: true, subLevels: [] })
    village = progress.villages[progress.villages.length - 1]
  }

  let sub = village.subLevels.find((s) => s.subLevelId === subLevelId)
  if (!sub) {
    village.subLevels.push({ subLevelId, completed: true })
  } else {
    sub.completed = true
  }

  await progress.save()
  return progress
}

async function unlockVillage(guestId, villageId) {
  const progress = await getOrCreateProgress(guestId)
  const keyState = await getOrCreateKeys(guestId)

  // Must be the current village
  if (progress.currentVillageId !== villageId) {
    throw new Error('ต้องปลดล็อกหมู่บ้านปัจจุบันเท่านั้น')
  }

  // All 12 sublevels must be completed
  const village = progress.villages.find((v) => v.villageId === villageId)
  if (!village) {
    throw new Error(`ต้องผ่านครบ ${TOTAL_SUBLEVELS} ด่านก่อน (ผ่านแล้ว 0 ด่าน)`)
  }
  const completedCount = village.subLevels.filter((s) => s.completed).length

  if (completedCount < TOTAL_SUBLEVELS) {
    throw new Error(`ต้องผ่านครบ ${TOTAL_SUBLEVELS} ด่านก่อน (ผ่านแล้ว ${completedCount} ด่าน)`)
  }

  // Must have at least 1 key
  if (keyState.keys < 1) {
    throw new Error('ไม่มีกุญแจเหลือ')
  }

  keyState.keys = Math.max(0, keyState.keys - 1)
  await keyState.save()

  progress.currentVillageId = villageId + 1
  const nextVillage = progress.villages.find((v) => v.villageId === villageId + 1)
  if (!nextVillage) {
    progress.villages.push({ villageId: villageId + 1, unlocked: true, subLevels: [] })
  } else {
    nextVillage.unlocked = true
  }

  await progress.save()
  return { progress, keys: keyState.keys }
}

module.exports = { getProgression, completeSubLevel, unlockVillage }
