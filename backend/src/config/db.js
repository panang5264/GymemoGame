const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI)
    console.log(`✅ MongoDB เชื่อมต่อสำเร็จ: ${conn.connection.host}`)
  } catch (error) {
    console.error(`❌ เกิดข้อผิดพลาดในการเชื่อมต่อ MongoDB: ${error.message}`)
    process.exit(1)
  }
}

module.exports = connectDB
