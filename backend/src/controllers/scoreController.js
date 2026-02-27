const Score = require('../models/Score')
const User = require('../models/User')

// @desc    ส่งคะแนน
// @route   POST /api/scores
// @access  Private
const submitScore = async (req, res) => {
  try {
    const { score, moves, timeTaken } = req.body

    // ตรวจสอบข้อมูลเบื้องต้น
    if (score === undefined || moves === undefined || timeTaken === undefined) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
      })
    }

    // Security & Validation Check
    if (score < 0 || moves < 0 || timeTaken < 0) {
      return res.status(400).json({
        success: false,
        message: 'ข้อมูลไม่ถูกต้อง (ห้ามติดลบ)'
      })
    }

    // แบบสมมติ: ถ้าค่าสูงเกินความเป็นไปได้ อาจจะเกิดจากการแก้โค้ดฝั่ง Client
    if (score > 1000000 || moves > 100000 || timeTaken > 86400) {
      return res.status(400).json({
        success: false,
        message: 'ข้อมูลผิดปกติ โปรดลองอีกครั้ง'
      })
    }

    // บันทึกคะแนน
    const newScore = await Score.create({
      user: req.user._id,
      score,
      moves,
      timeTaken
    })

    // อัปเดต highScore ถ้าคะแนนสูงกว่าเดิม
    const user = await User.findById(req.user._id)
    if (score > user.highScore) {
      user.highScore = score
      await user.save()
    }

    res.status(201).json({
      success: true,
      message: 'บันทึกคะแนนสำเร็จ',
      data: newScore
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการบันทึกคะแนน'
    })
  }
}

// @desc    กระดานผู้นำ
// @route   GET /api/scores/leaderboard
// @access  Public
const getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10

    // Fetch the top users ranked by their highScore
    const topUsers = await User.find({ highScore: { $gt: 0 } })
      .select('name phone highScore')
      .sort({ highScore: -1 })
      .limit(limit)

    // Format the response to match the expected frontend format
    const formattedScores = topUsers.map(user => ({
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone
      },
      score: user.highScore
    }))

    res.json({
      success: true,
      data: formattedScores
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลกระดานผู้นำ'
    })
  }
}

// @desc    คะแนนของฉัน
// @route   GET /api/scores/my-scores
// @access  Private
const getMyScores = async (req, res) => {
  try {
    const scores = await Score.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)

    res.json({
      success: true,
      data: scores
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล'
    })
  }
}

module.exports = {
  submitScore,
  getLeaderboard,
  getMyScores
}
