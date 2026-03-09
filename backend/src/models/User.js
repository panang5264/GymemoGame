const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'กรุณาระบุชื่อ'],
    maxlength: [50, 'ชื่อต้องไม่เกิน 50 ตัวอักษร']
  },
  username: {
    type: String,
    required: [true, 'กรุณาระบุชื่อผู้ใช้'],
    unique: true,
    trim: true,
    minlength: [3, 'ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร']
  },
  password: {
    type: String,
    required: [true, 'กรุณาระบุรหัสผ่าน'],
    minlength: [6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'],
    select: false
  },
  highScore: {
    type: Number,
    default: 0
  },
  totalKeys: {
    type: Number,
    default: 0
  },
  avatar: {
    type: String,
    default: 'avatar-1'
  },
  privacyMode: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
}, {
  timestamps: true
})

// Hash password ก่อน save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next()
  }
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

// Method เปรียบเทียบรหัสผ่าน
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

module.exports = mongoose.model('User', userSchema)
