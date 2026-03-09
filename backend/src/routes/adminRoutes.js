const express = require('express')
const router = express.Router()
const { protect, admin } = require('../middleware/authMiddleware')
const User = require('../models/User')
const Score = require('../models/Score')
const GameAnalysis = require('../models/GameAnalysis')
const PlayerProgress = require('../models/PlayerProgress')

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', protect, admin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password')
        res.json({ success: true, count: users.length, data: users })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
router.delete('/users/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user) {
            return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' })
        }

        await User.findByIdAndDelete(req.params.id)
        res.json({ success: true, message: 'ลบผู้ใช้เรียบร้อยแล้ว' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// @desc    Get all guest sessions
// @route   GET /api/admin/guests
// @access  Private/Admin
router.get('/guests', protect, admin, async (req, res) => {
    try {
        const guests = await PlayerProgress.find({}).sort({ updatedAt: -1 })
        res.json({ success: true, count: guests.length, data: guests })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// @desc    Get system stats
// @route   GET /api/admin/stats
// @access  Private/Admin
router.get('/stats', protect, admin, async (req, res) => {
    try {
        const [totalUsers, totalGuests, totalScores] = await Promise.all([
            User.countDocuments({}),
            PlayerProgress.countDocuments({}),
            Score.countDocuments({})
        ])

        // Average scores per game type from GameAnalysis
        const averageScores = await GameAnalysis.aggregate([
            {
                $group: {
                    _id: '$gameType',
                    avgScore: { $avg: '$score' },
                    count: { $sum: 1 }
                }
            }
        ])

        res.json({
            success: true,
            data: {
                totalUsers,
                totalGuests,
                totalScores,
                averageScores
            }
        })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// @desc    Export Score Data (CSV-ready JSON)
// @route   GET /api/admin/export/scores
// @access  Private/Admin
router.get('/export/scores', protect, admin, async (req, res) => {
    try {
        const scores = await Score.find().populate('user', 'name phone')
        res.json({ success: true, data: scores })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// @desc    Export Analysis Data (CSV-ready JSON)
// @route   GET /api/admin/export/analysis
// @access  Private/Admin
router.get('/export/analysis', protect, admin, async (req, res) => {
    try {
        const analysis = await GameAnalysis.find()
        res.json({ success: true, data: analysis })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

module.exports = router
