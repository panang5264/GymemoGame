# Source Code Documentation: GymemoGame Project
Generated on: 2026-03-15

## 📋 Project Overview
**GymemoGame** เป็นแพลตฟอร์มเกมฝึกสมองที่รวบรวมมินิเกมในหลายด้าน (Cognitive Domains) มาไว้ในรูปแบบการผจญภัย โดยมีระบบจัดเก็บสถิติการเล่นเพื่อวิเคราะห์พัฒนาการของผู้เล่นอย่างละเอียด

---

## 📂 Part 1: Backend System (Core 5 Files)

### 1. Backend Entry Point (`backend/src/server.js`)
ทำหน้าที่ตั้งค่า Server, เชื่อมต่อ Database, และกำหนดเส้นทาง API ทั้งหมด
```javascript
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')
const app = express()

// เชื่อมต่อ Database และสร้าง Admin เริ่มต้น
const connectDB = require('./config/db')
connectDB().then(() => { require('./scripts/createAdmin')() })

app.use(cors())
app.use(express.json())

// API Routes
app.use('/api/auth', require('./routes/authRoutes'))
app.use('/api/admin', require('./routes/adminRoutes'))
app.use('/api/scores', require('./routes/scoreRoutes'))
app.use('/api/analysis', require('./routes/analysisRoutes'))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))
```

### 2. Database configuration (`backend/src/config/db.js`)
```javascript
const mongoose = require('mongoose')
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI)
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`❌ Error: ${error.message}`); process.exit(1)
  }
}
module.exports = connectDB
```

### 3. User Data Model (`backend/src/models/User.js`)
```javascript
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  highScore: { type: Number, default: 0 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true })

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) next()
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})
module.exports = mongoose.model('User', userSchema)
```

### 4. Game Analysis Model (`backend/src/models/GameAnalysis.js`)
โมเดลสำคัญสำหรับเก็บสถิติการเล่นเพื่อนำไปวิเคราะห์ด้านบริหารจัดการ, หน่วยความจำ, และความเร็ว
```javascript
const mongoose = require('mongoose')
const gameAnalysisSchema = new mongoose.Schema({
    guestId: { type: String, required: true, index: true },
    gameType: { type: String, required: true, enum: ['management', 'calculation', 'spatial', 'reaction'] },
    level: { type: Number, required: true },
    score: { type: Number, required: true },
    timeTaken: { type: Number }, // seconds
    accuracy: { type: Number },  // 0-100%
    date: { type: Date, default: Date.now }
}, { timestamps: true })
module.exports = mongoose.model('GameAnalysis', gameAnalysisSchema)
```

### 5. Authentication Controller (`backend/src/controllers/authController.js`)
```javascript
const User = require('../models/User')
const jwt = require('jsonwebtoken')

const login = async (req, res) => {
  const { phone, password } = req.body
  const user = await User.findOne({ phone }).select('+password')
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' })
  }
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })
  res.json({ success: true, data: { name: user.name, role: user.role, token } })
}
module.exports = { login, register: require('./registerLogic') } // simplified
```

---

## 🎨 Part 2: Frontend System (Core 5 Files)

### 1. Global Application Layout (`frontend/src/app/layout.tsx`)
```tsx
import { AuthProvider } from '@/contexts/AuthContext'
import { ProgressProvider } from '@/contexts/ProgressContext'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <AuthProvider>
          <ProgressProvider>{children}</ProgressProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
```

### 2. Main Header Component (`frontend/src/components/Header.tsx`)
```tsx
'use client'
import { useAuth } from '@/contexts/AuthContext'
export default function Header() {
  const { user, logout } = useAuth()
  return (
    <header className="sticky top-0 z-[100] bg-white/90 backdrop-blur-md border-b-2">
      <div className="flex justify-between items-center p-4">
        <div className="text-2xl font-black">Gymemo 🧠</div>
        {user ? (
          <button onClick={logout} className="bg-rose-50 text-rose-500 p-2 rounded">Logout 👋</button>
        ) : (
          <button className="bg-indigo-600 text-white p-2 rounded">Login</button>
        )}
      </div>
    </header>
  )
}
```

### 3. API Communication Layer (`frontend/src/lib/api.ts`)
```typescript
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api'

export async function submitScore(token: string, score: number, moves: number, timeTaken: number) {
  const res = await fetch(`${API_BASE_URL}/scores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ score, moves, timeTaken }),
  })
  return res.json()
}
```

### 4. Authentication Context (`frontend/src/contexts/AuthContext.tsx`)
```tsx
'use client'
import { createContext, useState, useEffect } from 'react'
import Cookies from 'js-cookie'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(Cookies.get('token'))

  useEffect(() => {
    if (token) fetchUserProfile(token).then(data => setUser(data))
  }, [token])

  const login = (newToken, userData) => {
    Cookies.set('token', newToken); setToken(newToken); setUser(userData)
  }
  return <AuthContext.Provider value={{ user, token, login }}>{children}</AuthContext.Provider>
}
```

### 5. Admin Module Dashboard (`frontend/src/app/admin/page.tsx`)
```tsx
'use client'
import { useState, useEffect } from 'react'
import { adminGetStats, adminGetUsers } from '@/lib/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  useEffect(() => {
    fetchAdminData().then(data => setStats(data))
  }, [])

  return (
    <div className="p-12">
      <h1 className="text-4xl font-black">Admin Dashboard 👑</h1>
      {stats && <div className="grid grid-cols-3 gap-8">
         <div className="bg-indigo-50 p-8 rounded-3xl">Users: {stats.totalUsers}</div>
      </div>}
    </div>
  )
}
```

---
**End of Source Code Documentation**
