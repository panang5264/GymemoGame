# 🧠 GymemoGame

เกมฝึกสมอง — จับคู่การ์ดเพื่อฝึกความจำ พัฒนาสมองไปพร้อมกับความสนุก!

---

## 📋 สารบัญ

- [สิ่งที่ต้องติดตั้งก่อน](#สิ่งที่ต้องติดตั้งก่อน)
- [วิธีรันโปรเจกต์](#วิธีรันโปรเจกต์)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Tech Stack](#tech-stack)

---

## สิ่งที่ต้องติดตั้งก่อน

| ซอฟต์แวร์ | เวอร์ชัน | ลิงก์ |
|-----------|---------|------|
| Node.js | v18 ขึ้นไป | [nodejs.org](https://nodejs.org) |
| MongoDB | v6 ขึ้นไป | [mongodb.com](https://www.mongodb.com/try/download/community) หรือใช้ [MongoDB Atlas](https://www.mongodb.com/atlas) |

---

## วิธีรันโปรเจกต์

### 1. Clone โปรเจกต์

```bash
git clone https://github.com/panang5264/GymemoGame.git
cd GymemoGame
```

### 2. ตั้งค่า Backend

```bash
cd backend
npm install
cp .env.example .env
```

แก้ไขไฟล์ `.env` ตามต้องการ:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/gymemo
JWT_SECRET=ใส่_secret_ของคุณ_ตรงนี้
NODE_ENV=development
```

> 💡 ถ้าใช้ MongoDB Atlas ให้เปลี่ยน `MONGODB_URI` เป็น connection string ของ Atlas

รัน Backend:

```bash
npm run dev
```

✅ สำเร็จจะเห็น:

```
🚀 Gymemo Backend running on port 3001
✅ MongoDB Connected: localhost
```

### 3. ใส่ข้อมูลตัวอย่าง (Optional)

```bash
npm run seed
```

จะได้ข้อมูลตัวอย่าง 3 users + 5 scores พร้อม login credentials

### 4. ตั้งค่า Frontend

เปิด **terminal ใหม่** แล้วรัน:

```bash
cd frontend
npm install
npm run dev
```

✅ สำเร็จจะเห็น:

```
▲ Next.js 14.1.0
- Local: http://localhost:3000
```

### 5. เปิดเล่น! 🎮

เปิดเบราว์เซอร์ไปที่ **http://localhost:3000**

> ⚠️ **สำคัญ**: ต้องรัน **ทั้ง Backend และ Frontend** พร้อมกัน (เปิด 2 terminals)

---

## สรุป Commands

| ทำอะไร | คำสั่ง | Directory |
|--------|--------|-----------|
| รัน Backend (dev) | `npm run dev` | `backend/` |
| รัน Frontend (dev) | `npm run dev` | `frontend/` |
| Seed ข้อมูลตัวอย่าง | `npm run seed` | `backend/` |
| Build Frontend | `npm run build` | `frontend/` |
| รัน Backend (prod) | `npm start` | `backend/` |
| รัน Frontend (prod) | `npm start` | `frontend/` |

## Ports

| Service | URL |
|---------|-----|
| Frontend (Next.js) | `http://localhost:3000` |
| Backend API (Express) | `http://localhost:3001` |
| MongoDB | `mongodb://localhost:27017/gymemo` |

---

## โครงสร้างโปรเจกต์

```
GymemoGame/
├── Gymemo.md
│
├── frontend/                     # Next.js 14 + TypeScript
│   ├── package.json
│   ├── next.config.js
│   ├── tsconfig.json
│   └── src/
│       ├── app/
│       │   ├── layout.tsx        # Root Layout
│       │   ├── page.tsx          # หน้า Index (Home)
│       │   ├── globals.css       # Global Styles
│       │   └── game/
│       │       └── page.tsx      # หน้าเล่นเกม
│       └── components/
│           ├── Header.tsx        # แถบนำทาง
│           ├─��� Footer.tsx        # ส่วนท้าย
│           ├── GameBoard.tsx     # กระดานเกม
│           ├── GameCard.tsx      # การ์ดในเกม
│           ├── ScoreBoard.tsx    # แสดงคะแนน
│           └── Timer.tsx         # ตัวจับเวลา
│
├── backend/                      # Express + Mongoose
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── server.js             # Entry point
│       ├── config/
│       │   └── db.js             # เชื่อมต่อ MongoDB
│       ├── models/
│       │   ├── User.js           # Schema ผู้ใช้
│       │   └── Score.js          # Schema คะแนน
│       ├── controllers/
│       │   ├── authController.js # Logic สมัคร/เข้าสู่ระบบ
│       │   └── scoreController.js# Logic คะแนน
│       ├── routes/
│       │   ├── authRoutes.js     # เส้นทาง Auth
│       │   └── scoreRoutes.js    # เส้นทาง Score
│       └── middleware/
│           └── authMiddleware.js # ตรวจสอบ JWT
│
└── database/
    ├── README.md                 # เอกสาร Schema
    └── seed.js                   # ข้อมูลตัวอย่าง
```

---

## API Endpoints

### 🔐 Auth (การยืนยันตัวตน)

| Method | Endpoint | Auth | คำอธิบาย | Body |
|--------|----------|------|----------|------|
| `POST` | `/api/auth/register` | ❌ | สมัครสมาชิก | `{ name, phone, password }` |
| `POST` | `/api/auth/login` | ❌ | เข้าสู่ระบบ | `{ phone, password }` |
| `GET` | `/api/auth/profile` | ✅ | ดูโปรไฟล์ | - |

### 🏆 Scores (คะแนน)

| Method | Endpoint | Auth | คำอธิบาย | Body |
|--------|----------|------|----------|------|
| `POST` | `/api/scores` | ✅ | ส่งคะแนน | `{ score, moves, timeTaken }` |
| `GET` | `/api/scores/leaderboard` | ❌ | กระดานผู้นำ (Top 10) | - |
| `GET` | `/api/scores/my-scores` | ✅ | คะแนนของฉัน | - |

### วิธีใช้ JWT Token

```
1. สมัคร/เข้าสู่ระบบ → ได้ token กลับมาใน response
2. ส่ง token ใน Header ของ request ที่ต้องการ Auth:
   Authorization: Bearer <token>
```

ตัวอย่างการเรียก API ด้วย curl:

```bash
# สมัครสมาชิก
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "ทดสอบ", "phone": "0812345678", "password": "123456"}'

# เข้าสู่ระบบ
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "0812345678", "password": "123456"}'

# ส่งคะแนน (ต้องมี Token)
curl -X POST http://localhost:3001/api/scores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{"score": 80, "moves": 12, "timeTaken": 45}'

# ดู Leaderboard
curl http://localhost:3001/api/scores/leaderboard
```

---

## Database Schema

### Users Collection

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | ✅ | ชื่อผู้ใช้ (สูงสุด 50 ตัวอักษร) |
| `phone` | String | ✅ | เบอร์โทรศัพท์ (unique, ใช้เข้าสู่ระบบ) |
| `password` | String | ✅ | รหัสผ่าน (hashed ด้วย bcrypt) |
| `highScore` | Number | ❌ | คะแนนสูงสุด (default: 0) |
| `createdAt` | Date | auto | วันที่สร้าง |
| `updatedAt` | Date | auto | วันที่อัปเดตล่าสุด |

### Scores Collection

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user` | ObjectId | ✅ | อ้างอิง Users Collection |
| `score` | Number | ✅ | คะแนนที่ได้ |
| `moves` | Number | ✅ | จำนวนครั้งที่เปิดการ์ด |
| `timeTaken` | Number | ✅ | เวลาที่ใช้ (วินาที) |
| `createdAt` | Date | auto | วันที่เล่น |
| `updatedAt` | Date | auto | วันที่อัปเดตล่าสุด |

### Relationships

```
Users (1) ──── (N) Scores
ผู้ใช้ 1 คนมีได้หลายคะแนน (ทุกครั้งที่เล่นจบ)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript |
| Backend | Express.js, Node.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| HTTP Client | Axios |
