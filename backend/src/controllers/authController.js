const jwt = require('jsonwebtoken')
const User = require('../models/User')

// @desc    สมัครสมาชิก
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, phone, password } = req.body

    // ตรวจสอบข้อมูล
    if (!name || !phone || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน' 
      })
    }

    // ตรวจสอบว่ามีเบอร์โทรนี้แล้วหรือไม่
    const userExists = await User.findOne({ phone })
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว' 
      })
    }

    // สร้าง user ใหม่
    const user = await User.create({
      name,
      phone,
      password
    })

    // สร้าง token
    const token = generateToken(user._id)

    res.status(201).json({
      success: true,
      message: 'สมัครสมาชิกสำเร็จ',
      data: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        highScore: user.highScore,
        token
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' 
    })
  }
}

// @desc    เข้าสู่ระบบ
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { phone, password } = req.body

    // ตรวจสอบข้อมูล
    if (!phone || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'กรุณากรอกเบอร์โทรและรหัสผ่าน' 
      })
    }

    // หา user และดึง password ด้วย
    const user = await User.findOne({ phone }).select('+password')

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'เบอร์โทรหรือรหัสผ่านไม่ถูกต้อง' 
      })
    }

    // ตรวจสอบรหัสผ่าน
    const isPasswordCorrect = await user.comparePassword(password)

    if (!isPasswordCorrect) {
      return res.status(401).json({ 
        success: false, 
        message: 'เบอร์โทรหรือรหัสผ่านไม่ถูกต้อง' 
      })
    }

    // สร้าง token
    const token = generateToken(user._id)

    res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      data: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        highScore: user.highScore,
        token
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' 
    })
  }
}

// @desc    ดูโปรไฟล์
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'ไม่พบผู้ใช้งาน' 
      })
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        highScore: user.highScore,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' 
    })
  }
}

// Helper function สร้าง JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  })
}

module.exports = {
  register,
  login,
  getProfile
}
