const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'กรุณาระบุชื่อ'],
    maxlength: [50, 'ชื่อต้องไม่เกิน 50 ตัวอักษร']
  },
  phone: {
    type: String,
    required: [true, 'กรุณาระบุเบอร์โทรศัพท์'],
    unique: true,
    match: [/^0\d{9}$/, 'เบอร์โทรศัพท์ไม่ถูกต้อง (ต้องเป็น 0xxxxxxxxx)']
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
  }
}, {
  timestamps: true
})

// Hash password ก่อน save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next()
  }
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

// Method เปรียบเทียบรหัสผ่าน
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

module.exports = mongoose.model('User', userSchema)
