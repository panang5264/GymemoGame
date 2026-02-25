const express = require('express')
const router = express.Router()
const {
  getProgression,
  completeSubLevel,
  unlockVillage,
} = require('../services/progressionService')
const {
  getSyncProgress,
  updateSyncProgress
} = require('../controllers/syncController')
const { protect } = require('../middleware/authMiddleware')

// GET /api/progression/sync
router.get('/sync', protect, getSyncProgress)

// POST /api/progression/sync
router.post('/sync', protect, updateSyncProgress)

// GET /api/progression/:guestId
router.get('/:guestId', async (req, res, next) => {
  try {
    const data = await getProgression(req.params.guestId)
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
})

// POST /api/progression/complete
router.post('/complete', async (req, res, next) => {
  try {
    const { guestId, villageId, subLevelId } = req.body
    if (!guestId || villageId == null || subLevelId == null) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุ guestId, villageId, subLevelId' })
    }
    const progress = await completeSubLevel(guestId, Number(villageId), Number(subLevelId))
    res.json({ success: true, data: progress })
  } catch (err) {
    if (err.message) {
      return res.status(400).json({ success: false, message: err.message })
    }
    next(err)
  }
})

// POST /api/progression/unlock
router.post('/unlock', async (req, res, next) => {
  try {
    const { guestId, villageId } = req.body
    if (!guestId || villageId == null) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุ guestId และ villageId' })
    }
    const result = await unlockVillage(guestId, Number(villageId))
    res.json({ success: true, data: result })
  } catch (err) {
    if (err.message) {
      return res.status(400).json({ success: false, message: err.message })
    }
    next(err)
  }
})

module.exports = router
