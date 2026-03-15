# Source Code Documentation: GymemoGame Project
Generated on: 2026-03-15

## 🧠 Project Overview
This document contains the core source code for the **GymemoGame** project, covering both Backend infrastructure and Frontend user interface components.

---

## 📂 Part 1: Backend System (Node.js & MongoDB)

### 1.1 Main Entry Point
**File:** `backend/src/server.js`
```javascript
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')
const authRoutes = require('./routes/authRoutes')
const scoreRoutes = require('./routes/scoreRoutes')
const progressionRoutes = require('./routes/progressionRoutes')
const analysisRoutes = require('./routes/analysisRoutes')
const dailyRoutes = require('./routes/dailyRoutes')
const { errorHandler } = require('./middleware/errorMiddleware')

const app = express()

const createAdmin = require('./scripts/createAdmin')

// เชื่อมต่อ Database
connectDB().then(() => {
  createAdmin()
})

// Setup Cron Jobs
const setupCronJobs = require('./services/cronService')
setupCronJobs()

// Middleware
app.use(cors())
app.use(express.json())

// Rate Limiting
const { apiLimiter } = require('./middleware/rateLimiter')
app.use('/api', apiLimiter)

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/scores', scoreRoutes)
app.use('/api/progression', progressionRoutes)
app.use('/api/analysis', analysisRoutes)
app.use('/api/daily', dailyRoutes)
const adminRoutes = require('./routes/adminRoutes')
app.use('/api/admin', adminRoutes)

// Error Handler Middleware
app.use(errorHandler)

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`🚀 Server กำลังทำงานที่พอร์ต ${PORT}`)
})
```

### 1.2 Database Configuration
**File:** `backend/src/config/db.js`
```javascript
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
```

### 1.3 User Model
**File:** `backend/src/models/User.js`
```javascript
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
    required: [true, 'กรุณาระบุเบอร์โทรศัพท์หรือชื่อเข้าสู่ระบบ'],
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'กรุณาระบุรหัสผ่าน'],
    minlength: [6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'],
    select: false
  },
  highScore: { type: Number, default: 0 },
  totalKeys: { type: Number, default: 0 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, {
  timestamps: true
})

// Hash password ก่อน save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) next()
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

module.exports = mongoose.model('User', userSchema)
```

### 1.4 Business Logic (Admin Routes)
**File:** `backend/src/routes/adminRoutes.js`
```javascript
const express = require('express')
const router = express.Router()
const { protect, admin } = require('../middleware/authMiddleware')
const User = require('../models/User')
const GameAnalysis = require('../models/GameAnalysis')

router.get('/users', protect, admin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password')
        res.json({ success: true, count: users.length, data: users })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

router.get('/stats', protect, admin, async (req, res) => {
    try {
        const [totalUsers, totalGuests, totalScores] = await Promise.all([
            User.countDocuments({}),
            PlayerProgress.countDocuments({}),
            GameAnalysis.countDocuments({})
        ])
        res.json({ success: true, data: { totalUsers, totalGuests, totalScores } })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

module.exports = router
```

---

## 🎨 Part 2: Frontend System (Next.js & TypeScript)

### 2.1 Core API Service
**File:** `frontend/src/lib/api.ts`
```typescript
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api'

export async function loginUser(phone: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Failed to login')
  return data
}

export async function adminGetStats(token: string) {
  const res = await fetch(`${API_BASE_URL}/admin/stats`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  return res.json()
}
```

### 2.2 Global State (Auth Context)
**File:** `frontend/src/contexts/AuthContext.tsx`
```tsx
'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import { getUserProfile } from '@/lib/api'

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const storedToken = Cookies.get('token')
        if (storedToken) {
            setToken(storedToken)
            fetchUser(storedToken)
        } else {
            setLoading(false)
        }
    }, [])

    const login = async (authToken, userData) => {
        Cookies.set('token', authToken, { expires: 7 })
        setToken(authToken)
        setUser(userData)
    }

    return (
        <AuthContext.Provider value={{ user, token, loading, login }}>
            {children}
        </AuthContext.Provider>
    )
}
```

### 2.3 Main Application Layout
**File:** `frontend/src/app/layout.tsx`
```tsx
import { AuthProvider } from '@/contexts/AuthContext'
import { ProgressProvider } from '@/contexts/ProgressContext'
import './globals.css'

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        <AuthProvider>
          <ProgressProvider>
            <main className="main">{children}</main>
          </ProgressProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
```

### 2.4 Admin Module (Dashboard UI)
**File:** `frontend/src/app/admin/page.tsx`
```tsx
'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { adminGetUsers, adminGetStats } from '@/lib/api'

export default function AdminDashboard() {
    const { user, token } = useAuth()
    const [stats, setStats] = useState(null)
    const [users, setUsers] = useState([])

    useEffect(() => {
        if (token && user?.role === 'admin') fetchData()
    }, [token, user])

    const fetchData = async () => {
        try {
            const [s, u] = await Promise.all([
                adminGetStats(token),
                adminGetUsers(token)
            ])
            setStats(s.data)
            setUsers(u.data)
        } catch (err) { console.error(err) }
    }

    return (
        <div className="min-h-screen p-12">
            <h1>Admin Dashboard 👑</h1>
            {/* View Stats & Management implementation... */}
        </div>
    )
}
```

---
**End of Source Code Documentation**
