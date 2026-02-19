const Score = require('../models/Score')
const User = require('../models/User')

// @desc    ส่งคะแนน
// @route   POST /api/scores
// @access  Private
const submitScore = async (req, res) => {
  try {
    const { score, moves, timeTaken } = req.body

    // ตรวจสอบข้อมูล
    if (score === undefined || moves === undefined || timeTaken === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน' 
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

    const scores = await Score.find()
      .sort({ score: -1, timeTaken: 1 })
      .limit(limit)
      .populate('user', 'name phone')

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
