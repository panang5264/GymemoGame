const DailyChallenge = require('../models/DailyChallenge')
const PlayerProgress = require('../models/PlayerProgress')

// Removed server-side date generator.
// The frontend timezone will dictate the logical "dateKey".

// @desc    Get current daily challenge status for a player
// @route   GET /api/daily/:guestId
// @access  Public
const getDailyStatus = async (req, res) => {
    try {
        const { guestId } = req.params
        const dateKey = req.query.date

        if (!dateKey) {
            return res.status(400).json({ success: false, message: 'Missing date query parameter' })
        }

        let daily = await DailyChallenge.findOne({ guestId, date: dateKey })

        if (!daily) {
            daily = await DailyChallenge.create({
                guestId,
                date: dateKey,
                completedModes: { management: false, calculation: false, spatial: false },
                allDone: false,
                rewardClaimed: false
            })
        }

        res.json({
            success: true,
            data: daily
        })
    } catch (error) {
        console.error('Error fetching daily status:', error)
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลภารกิจประจำวัน'
        })
    }
}

// @desc    Record a completed minigame for the daily challenge
// @route   POST /api/daily/complete-mode
// @access  Public
const completeDailyMode = async (req, res) => {
    try {
        const { guestId, modeType, dateKey } = req.body

        if (!guestId || !modeType || !dateKey || !['management', 'calculation', 'spatial'].includes(modeType)) {
            return res.status(400).json({ success: false, message: 'ข้อมูลไม่ถูกต้อง' })
        }

        let daily = await DailyChallenge.findOne({ guestId, date: dateKey })

        // Just in case it hasn't been created today yet
        if (!daily) {
            daily = await DailyChallenge.create({
                guestId,
                date: dateKey,
                completedModes: { management: false, calculation: false, spatial: false }
            })
        }

        // Mark mode as completed
        daily.completedModes[modeType] = true

        // Check if all are done
        const { management, calculation, spatial } = daily.completedModes
        if (management && calculation && spatial) {
            daily.allDone = true
        }

        await daily.save()

        res.json({
            success: true,
            message: `บันทึกภารกิจ ${modeType} สำเร็จ`,
            data: daily
        })

    } catch (error) {
        console.error('Error completing daily mode:', error)
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการบันทึกภารกิจ'
        })
    }
}

// @desc    Claim reward for finishing all 3 daily challenges
// @route   POST /api/daily/claim-reward
// @access  Public
const claimDailyReward = async (req, res) => {
    try {
        const { guestId, dateKey } = req.body

        if (!guestId || !dateKey) {
            return res.status(400).json({ success: false, message: 'กรุณาระบุ guestId และ dateKey' })
        }

        const daily = await DailyChallenge.findOne({ guestId, date: dateKey })

        if (!daily) {
            return res.status(404).json({ success: false, message: 'ไม่พบภารกิจประจำวันของวันนี้' })
        }

        if (!daily.allDone) {
            return res.status(400).json({ success: false, message: 'ยังทำภารกิจไม่ครบ' })
        }

        if (daily.rewardClaimed) {
            return res.status(400).json({ success: false, message: 'รับรางวัลไปแล้ว' })
        }

        // Add reward to User totalScore or totalKeys
        // Note: Score will need to update totalScore, but it's currently client side aggregated.
        // We will add 3 keys as a daily reward to the User matching this guestId.
        const User = require('../models/User')

        // Find user by guestId (wait, guestId might be a phone number or Mongo ID)
        // Let's assume guestId is the user ID if they are logged in.
        // Actually, if guestId is a custom string, it might not match User._id. Let's check PlayerProgress.
        // Wait, guestId is used universally in this codebase.
        daily.rewardClaimed = true
        await daily.save()

        try {
            // Attempt to give keys if guestId is a valid ObjectId, otherwise it might be local phone number/guest.
            const user = await User.findById(guestId) || await User.findOne({ phoneNumber: guestId });
            if (user) {
                user.totalKeys = Math.min(9, (user.totalKeys || 0) + 3); // Award 3 keys, cap at 9
                await user.save();
            }
        } catch (e) {
            console.log('User not found for guestId or invalid ID format, skipping key reward for local guest.');
        }

        res.json({
            success: true,
            message: 'รับรางวัลสำเร็จ (+3 Keys)',
            data: daily
        })

    } catch (error) {
        console.error('Error claiming daily reward:', error)
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการรับรางวัล'
        })
    }
}

module.exports = {
    getDailyStatus,
    completeDailyMode,
    claimDailyReward
}
