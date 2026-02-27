const express = require('express')
const router = express.Router()
const {
    getDailyStatus,
    completeDailyMode,
    claimDailyReward
} = require('../controllers/dailyController')
const { protect } = require('../middleware/authMiddleware')

// You can wrap these with protect middleware if they are only for logged in users
// or allow guestId if guest experience is allowed. Assuming guestId is primary identifier.

// GET /api/daily/status/:guestId
router.get('/status/:guestId', getDailyStatus)

// POST /api/daily/complete-mode
router.post('/complete-mode', completeDailyMode)

// POST /api/daily/claim-reward
router.post('/claim-reward', claimDailyReward)

module.exports = router
