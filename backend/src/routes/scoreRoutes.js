const express = require('express')
const router = express.Router()
const { submitScore, getLeaderboard, getMyScores } = require('../controllers/scoreController')
const { protect } = require('../middleware/authMiddleware')

router.post('/', protect, submitScore)
router.get('/leaderboard', getLeaderboard)
router.get('/my-scores', protect, getMyScores)

module.exports = router
