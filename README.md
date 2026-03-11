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
- [การ Deploy ขึ้น Production (แนะนำ)](#การ-deploy-ขึ้น-production-แนะนำ)
- [วิธีรันโปรเจกต์แบบ Developer](#วิธีรันโปรเจกต์แบบ-developer)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [เทคโนโลยีที่ใช้](#เทคโนโลยีที่ใช้)

---

## สิ่งที่ต้องติดตั้งก่อน
| ซอฟต์แวร์ | เวอร์ชัน | ลิงก์ |
|-----------|---------|------|
| Docker Desktop | ล่าสุด | [docker.com](https://www.docker.com/) |
| Git | ล่าสุด | [git-scm.com](https://git-scm.com/) |

*(หากใช้ Docker ไม่จำเป็นต้องลง Node.js และ MongoDB ในเครื่อง)*

---

## การ Deploy ขึ้น Production (แนะนำ)
โครงสร้างของโปรเจกต์ถูกออกแบบมาให้พร้อมสำหรับการ Deploy ผ่าน `docker-compose` ซึ่งรวมทั้ง Frontend, Backend และ Database (MongoDB) ไว้ในคำสั่งเดียว

### ขั้นตอนการ Deploy:

1. **โคลน Source Code**
   ```bash
   git clone https://github.com/panang5264/GymemoGame.git
   cd GymemoGame
   ```

2. **เตรียมไฟล์ Environment Variables (`.env`)**
   ในโฟลเดอร์ `backend` ให้สร้างไฟล์ `.env` ขึ้นมา (หรือก็อปปี้จาก `.env.example` ถ้ามี) และกำหนดค่าดังนี้:
   ```env
   # ตัวอย่างไฟล์ backend/.env
   PORT=3001
   MONGODB_URI=mongodb://mongo:27017/gymemo
   JWT_SECRET=ใส่_SECRET_KEY_ของคุณที่นี่_ควรเป็นข้อความสุ่มยาวๆ
   NODE_ENV=production
   ```
   *หมายเหตุ: ใน `docker-compose.yml` ได้ตั้งค่าเบื้องต้นให้แล้ว แต่ควรเช็คไฟล์ `.env` ของ backend ควบคู่ไปด้วยเพื่อให้ Production ปลอดภัย*

3. **รันระบบทั้งหมดด้วยคำสั่งเดียว**
   เปิด Terminal ในโฟลเดอร์หลักของโปรเจกต์ (ที่มีไฟล์ `docker-compose.yml`) และพิมพ์:
   ```bash
   docker-compose up -d --build
   ```
   คำสั่งนี้จะทำการดาวน์โหลด ติดตั้ง Build และสร้าง Container ให้ทั้งหมดในโหมดพื้นหลัง (Detached mode)

4. **การเข้าใช้งาน**
   - **Frontend (หน้าเว็บ):** เข้าถึงได้ที่ `http://localhost:3000` (หรือ IP ของเซิร์ฟเวอร์โดเมนของคุณ)
   - **Backend (API):** จะรันอยู่ที่ `http://localhost:3001` โดยมี MongoDB ซ่อนอยู่ภายใน Container

### 🛑 วิธีการเปลี่ยน Domain / URL สำหรับ Frontend
หากคุณนำไปขึ้น Host หรือ Server จริง ที่ไม่ได้ใช้ `localhost` คุณต้องไปแก้ไขไฟล์ `docker-compose.yml` ตรงส่วน `frontend` ดังนี้:

```yaml
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        # เปลี่ยน localhost:3001 เป็น URL/IP/Domain Backend ของคุณ
        - =https://api.yourdomain.com
```
และทำการ Build ใหม่ด้วยคำสั่ง `docker-compose up -d --build`

---

## วิธีรันโปรเจกต์แบบ Developer
วิธีนี้เหมาะสำหรับผู้ที่ต้องการศึกษาและแก้ไข Code โดยตรง โดยต้องติดตั้ง Node.js และเปิด Database ของตนเอง (เช่น MongoDB Atlas)

#### 1. เปิด Terminal 1: ตั้งค่า Backend
```bash
cd backend
npm install
npm run dev
```

#### 2. เปิด Terminal 2: ตั้งค่า Frontend
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
│   └── Dockerfile                # สำหรับ Deploy Frontend
│   
├── backend/                      # Node.js + Express + MongoDB
│   ├── src/
│   │   ├── models/               # Schema (User, GameAnalysis, CognitiveProfile)
│   │   ├── routes/               # Routes (Auth, Score, Analysis)
│   │   ├── services/             # Business Logic (Analysis Recalculation)
│   │   └── controllers/          # Request Handlers
│   └── Dockerfile                # สำหรับ Deploy Backend
│
└── docker-compose.yml            # ไฟล์ควบคุมการ Deploy ทั้งระบบ
```

---

## เทคโนโลยีที่ใช้ (Tech Stack)
- **Frontend**: Next.js 14, TypeScript, React Context, TailwindCSS, Framer Motion
- **Backend**: Express.js, Mongoose, JWT, Node-cron
- **Database**: MongoDB (ใช้งานผ่าน Docker หรือ Atlas)
- **Deployment**: Docker, Docker Compose

---

© 2024 GymemoGame Team - ผจญภัยเพื่อสมองที่แข็งแรง 🧠✨

