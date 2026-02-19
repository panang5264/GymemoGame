const jwt = require('jsonwebtoken')
const User = require('../models/User')

const protect = async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // ดึง token จาก Authorization header
      token = req.headers.authorization.split(' ')[1]

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // หา user จาก decoded id
      req.user = await User.findById(decoded.id).select('-password')

      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'ไม่พบผู้ใช้งาน' 
        })
      }

      next()
    } catch (error) {
      console.error(error)
      return res.status(401).json({ 
        success: false, 
        message: 'ไม่ได้รับอนุญาต, token ไม่ถูกต้อง' 
      })
    }
  }

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'ไม่ได้รับอนุญาต, ไม่มี token' 
    })
  }
}

module.exports = { protect }
