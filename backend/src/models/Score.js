const mongoose = require('mongoose')

const scoreSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'กรุณาระบุผู้ใช้']
  },
  score: {
    type: Number,
    required: [true, 'กรุณาระบุคะแนน'],
    min: [0, 'คะแนนต้องไม่น้อยกว่า 0']
  },
  moves: {
    type: Number,
    required: [true, 'กรุณาระบุจำนวนครั้ง'],
    min: [0, 'จำนวนครั้งต้องไม่น้อยกว่า 0']
  },
  timeTaken: {
    type: Number,
    required: [true, 'กรุณาระบุเวลาที่ใช้'],
    min: [0, 'เวลาต้องไม่น้อยกว่า 0']
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('Score', scoreSchema)
