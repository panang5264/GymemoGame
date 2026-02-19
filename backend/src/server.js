require('dotenv').config()
const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')
const authRoutes = require('./routes/authRoutes')
const scoreRoutes = require('./routes/scoreRoutes')

const app = express()

// เชื่อมต่อ Database
connectDB()

// Middleware
app.use(cors())
app.use(express.json())

// Health check และแสดง endpoints
app.get('/', (req, res) => {
  res.json({
    message: '🧠 Gymemo API Server',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile (Protected)'
      },
      scores: {
        submit: 'POST /api/scores (Protected)',
        leaderboard: 'GET /api/scores/leaderboard',
        myScores: 'GET /api/scores/my-scores (Protected)'
      }
    }
  })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/scores', scoreRoutes)

// Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`🚀 Server กำลังทำงานที่พอร์ต ${PORT}`)
})
