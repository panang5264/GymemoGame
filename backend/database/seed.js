require('dotenv').config({ path: '../backend/.env' })
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// Inline schemas เพื่อทำงานอิสระ
const userSchema = new mongoose.Schema({
  name: String,
  phone: String,
  password: String,
  highScore: { type: Number, default: 0 }
}, { timestamps: true })

const scoreSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  score: Number,
  moves: Number,
  timeTaken: Number
}, { timestamps: true })

const User = mongoose.model('User', userSchema)
const Score = mongoose.model('Score', scoreSchema)

async function seedDatabase() {
  try {
    // เชื่อมต่อ MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ เชื่อมต่อ MongoDB สำเร็จ')

    // ลบข้อมูลเก่า
    await User.deleteMany({})
    await Score.deleteMany({})
    console.log('🗑️  ลบข้อมูลเก่าแล้ว')

    // สร้าง users
    const password = await bcrypt.hash('123456', 10)
    
    const users = await User.create([
      {
        name: 'สมชาย ใจดี',
        phone: '0812345678',
        password,
        highScore: 950
      },
      {
        name: 'สมหญิง สวยงาม',
        phone: '0823456789',
        password,
        highScore: 920
      },
      {
        name: 'น้องเกม',
        phone: '0834567890',
        password,
        highScore: 880
      }
    ])

    console.log('✅ สร้าง users แล้ว 3 คน')

    // สร้าง scores
    const scores = await Score.create([
      {
        user: users[0]._id,
        score: 950,
        moves: 10,
        timeTaken: 45
      },
      {
        user: users[0]._id,
        score: 900,
        moves: 12,
        timeTaken: 52
      },
      {
        user: users[1]._id,
        score: 920,
        moves: 11,
        timeTaken: 48
      },
      {
        user: users[1]._id,
        score: 880,
        moves: 13,
        timeTaken: 55
      },
      {
        user: users[2]._id,
        score: 880,
        moves: 13,
        timeTaken: 50
      }
    ])

    console.log('✅ สร้าง scores แล้ว 5 รายการ')

    // อัปเดต highScores
    await User.findByIdAndUpdate(users[0]._id, { highScore: 950 })
    await User.findByIdAndUpdate(users[1]._id, { highScore: 920 })
    await User.findByIdAndUpdate(users[2]._id, { highScore: 880 })

    console.log('✅ อัปเดต highScores แล้ว')

    // แสดง login credentials
    console.log('\n📝 ข้อมูลสำหรับ login:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    users.forEach(user => {
      console.log(`ชื่อ: ${user.name}`)
      console.log(`เบอร์: ${user.phone}`)
      console.log(`รหัส: 123456`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    })

    console.log('\n✅ Seed ข้อมูลสำเร็จ!')
    process.exit(0)
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error)
    process.exit(1)
  }
}

seedDatabase()
