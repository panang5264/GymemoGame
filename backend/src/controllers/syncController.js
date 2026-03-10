const UserProgress = require('../models/UserProgress')
const User = require('../models/User')

// @desc    Get synced progress for current user
// @route   GET /api/progression/sync
// @access  Private
const getSyncProgress = async (req, res) => {
    try {
        const userProgress = await UserProgress.findOne({ userId: req.user._id })

        if (!userProgress) {
            return res.json({
                success: true,
                data: null // tells frontend no DB progress exists yet
            })
        }

        res.json({
            success: true,
            data: userProgress.progressData
        })
    } catch (error) {
        console.error('Error fetching sync progress:', error)
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลความคืบหน้า'
        })
    }
}

// @desc    Update synced progress for current user
// @route   POST /api/progression/sync
// @access  Private
const updateSyncProgress = async (req, res) => {
    try {
        const { progressData } = req.body

        if (!progressData) {
            return res.status(400).json({
                success: false,
                message: 'กรุณาส่งข้อมูลความคืบหน้า (progressData)'
            })
        }

        let userProgress = await UserProgress.findOne({ userId: req.user._id })

        if (userProgress) {
            userProgress.progressData = progressData
            userProgress.markModified('progressData')
            await userProgress.save()
        } else {
            userProgress = await UserProgress.create({
                userId: req.user._id,
                progressData
            })
        }

        // --- NEW: Sync totalScore to User highscore for Leaderboard ---
        try {
            if (progressData && progressData.totalScore !== undefined) {
                const user = await User.findById(req.user._id)
                if (user && progressData.totalScore > user.highScore) {
                    user.highScore = progressData.totalScore
                    await user.save()
                }
            }
        } catch (scoreErr) {
            console.error('Failed to sync highScore during progress update:', scoreErr)
            // non-fatal
        }
        // ----------------------------------------------------------------

        res.json({
            success: true,
            message: 'อัปเดตความคืบหน้าสำเร็จ',
            data: userProgress.progressData
        })
    } catch (error) {
        console.error('Error updating sync progress:', error)
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการบันทึกความคืบหน้า'
        })
    }
}

module.exports = {
    getSyncProgress,
    updateSyncProgress
}
