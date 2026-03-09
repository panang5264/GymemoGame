# 🧠 GymemoGame: Cognitive Adventure

**GymemoGame** คือแพลตฟอร์มเกมฝึกฝนทักษะสมอง (Cognitive Training) ที่ผสมผสานระบบการผจญภัย (Adventure) เข้ากับหลักการทางจิตวิทยา เพื่อช่วยพัฒนาทักษะด้านความจำ การตัดสินใจ และความรวดเร็วในการประมวลผล

---

## 🌟 ฟีเจอร์เด่น
- **🗺️ Adventure Mode**: ผจญภัยผ่าน 10 หมู่บ้านในแผนที่โลก เพื่อทำภารกิจฟื้นฟูความทรงจำ
- **📊 Cognitive Profile**: วิเคราะห์พัฒนาการสมอง 4 ด้าน (Executive Function, Working Memory, Processing Speed, Attention) แสดงผลผ่าน Radar Chart
- **🎮 Multi-Domain Minigames**: 
  - **Management**: ฝึกทักษะการบริหารจัดการและการแยกแยะ (Executive Function)
  - **Calculation**: ฝึกความรวดเร็วในการคิดคำนวณ (Processing Speed)
  - **Spatial**: ฝึกความจำขณะทำงานและมิติสัมพันธ์ (Working Memory)
  - **Reaction**: ฝึกการตอบสนองและสมาธิ (Attention)
- **👥 Guest Persistence**: ระบบจดจำตัวตนผู้เล่นแม้ไม่ได้เข้าสู่ระบบ (Persistent Guest ID) เพื่อให้ความก้าวหน้าไม่หายไป
- **🏆 Global Leaderboard**: แข่งขันกับผู้เล่นทั่วโลกเพื่อชิงอันดับสูงสุด

---

## 📋 สารบัญ
- [สิ่งที่ต้องติดตั้งก่อน](#สิ่งที่ต้องติดตั้งก่อน)
- [วิธีรันโปรเจกต์](#วิธีรันโปรเจกต์)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [API Endpoints](#api-endpoints)
- [เทคโนโลยีที่ใช้](#เทคโนโลยีที่ใช้)

---

## สิ่งที่ต้องติดตั้งก่อน
| ซอฟต์แวร์ | เวอร์ชัน | ลิงก์ |
|-----------|---------|------|
| Node.js | v18 ขึ้นไป | [nodejs.org](https://nodejs.org) |
| MongoDB | v6 ขึ้นไป | [mongodb.com](https://www.mongodb.com) |

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
# คัดเลือก .env และตั้งค่า MONGODB_URI, JWT_SECRET
npm run dev
```

### 3. ตั้งค่า Frontend
```bash
cd frontend
npm install
npm run dev
```
เปิดเบราว์เซอร์ไปที่ **http://localhost:3000** 🚀

---

## โครงสร้างโปรเจกต์
```
GymemoGame/
├── frontend/                     # Next.js 14 + Tailwind/Vanilla CSS
│   ├── src/
│   │   ├── app/                  # App Router & Pages
│   │   │   ├── minigame/         # รวมมินิเกมแยกตาม Domain
│   │   │   ├── world/            # แผนที่โลกและด่านหมู่บ้าน
│   │   │   └── leaderboard/      # ระบบจัดอันดับ
│   │   ├── components/           # UI Components (RadarChart, Timer, etc.)
│   │   ├── contexts/             # State Management (Auth, Progress)
│   │   └── lib/                  # Logic (Level System, API Client)
│   
├── backend/                      # Node.js + Express + MongoDB
│   ├── src/
│   │   ├── models/               # Schema (User, GameAnalysis, CognitiveProfile)
│   │   ├── routes/               # Routes (Auth, Score, Analysis)
│   │   ├── services/             # Business Logic (Analysis Recalculation)
│   │   └── controllers/          # Request Handlers
```

---

## API Endpoints (หลัก)

### 🧠 Analysis (วิเคราะห์สมอง)
- `GET /api/analysis/profile/:guestId` - ดึงข้อมูลสรุปทักษะสมองรายบุคคล
- `POST /api/analysis/record` - บันทึกผลการเล่นและ recalculate ทักษะสมอง

### 🔐 Auth & Progress
- `POST /api/auth/login` - เข้าสู่ระบบ
- `GET /api/progression/sync` - ดึงข้อมูลความก้าวหน้า (หมู่บ้าน, คะแนน)

### 🏆 Scores
- `GET /api/scores/leaderboard` - ดึงกระดานผู้นำสูงสุด

---

## เทคโนโลยีที่ใช้ (Tech Stack)
- **Frontend**: Next.js 14, TypeScript, React Context, Lucide/Framer Motion (สำหรับ Animation)
- **Backend**: Express.js, Mongoose, JWT, Node-cron
- **Database**: MongoDB (Atlas)
- **Design Style**: Rich Aesthetics, Glassmorphism, Premium Modern Web Design

---

© 2024 GymemoGame Team - ผจญภัยเพื่อสมองที่แข็งแรง 🧠✨

