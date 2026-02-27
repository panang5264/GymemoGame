# 🧠 Gymemo Game - Handover Documentation

ยินดีด้วย! คุณกำลังเข้ามารับช่วงต่อโปรเจกต์เกมฝึกสมองที่พัฒนาด้วย **Next.js (Frontend)** และ **Node.js/Express (Backend)** โดยเน้นการวิเคราะห์ศักยภาพสมอง (Cognitive Analytics) อย่างละเอียด

---

## 👨‍💻 สำหรับเพื่อน: ส่วนของ Back-end (Backend Developer Tasks)
*เหล่านี้คือส่วนที่ฝากเพื่อนช่วยดูแลต่อในฝั่งเซิร์ฟเวอร์และฐานข้อมูล*

### 1. Daily Challenges Database & Logic
- [ ] พัฒนา Schema และ Controller สำหรับเก็บสถานะ Daily Challenge ของ User แต่ละคน
- [ ] ทำระบบ Reset สถานะ Challenge ทุกๆ เที่ยงคืน (Cron job หรือ Time-based logic)
- [ ] พัฒนาระบบ Point/Reward เมื่อเล่นจบ Daily ให้บันทึกลง Profile

### 2. Analytics Aggregation & Reporting
- [ ] เพิ่มความสามารถใน `analysisService.js` ให้คำนวณ "ค่าเฉลี่ยรายสัปดาห์" (Weekly Average)
- [ ] ทำ API สำหรับดึงประวัติการเล่นย้อนหลังแบบระบุช่วงเวลา (Date Range)
- [ ] เพิ่มความเสถียรในการดึงข้อมูล Cognitive Profile สำหรับคนที่มี Data จำนวนมาก

### 3. API Security & Optimization
- [ ] ตรวจสอบความปลอดภัยของ API Endpoints ต่างๆ โดยเฉพาะการ record score
- [ ] ปรับปรุงการจัดการ Error ในฝั่ง Backend ให้ครอบคลุมทุกกรณี

---

## 🎨 สำหรับคุณ Nick: ส่วนของ Front-end & Visuals
*ส่วนนี้คือสิ่งที่คุณ Nick ต้องจัดการต่อเกี่ยวกับภาพรวมและการออกแบบ*

### 1. จุดที่ต้องนำรูปไปใส่แทน Placeholder (CRITICAL!)
- **Spatial Game (3D View)**: ในไฟล์ `spatial/page.tsx` ต้องเปลี่ยนจาก Emoji 📦 เป็นรูป Render ของกล่อง 3 มิติจริงๆ ในมุมมองต่างๆ (N, S, E, W)
- **Introduction Story**: ในไฟล์ `page.tsx` ส่วนที่เป็นเนื้อเรื่องคุณยาย ต้องใส่รูปภาพประกอบเหตุการณ์ และรูปตัวละครคุณยายเวอร์ชั่นต่างๆ
- **Village Map Decor**: เตรียมรูปหมู่บ้านที่เป็น Unique Icons สำหรับทั้ง 10 หมู่บ้านในหน้า World Map

### 2. UI Polish & Feel
- [ ] **Animations**: ปรับปรุงหน้าสรุปผล (Village Summary) ให้มีการเคลื่อนไหวของกราฟรังสีที่ลื่นกว่านี้
- [ ] **Ending Sequence**: ออกแบบหน้าจบเกมเมื่อปลดล็อกครบ 10 หมู่บ้าน (Trigger จาก event `gymemo:game_ending`)

### 3. Maze Tuning
- [ ] ปรับขนาด Rows/Cols ในไฟล์ `management/page.tsx` ให้ขนาดเขาวงกตแสดงผลพอดีกับหน้าจอ Laptop/Tablet

---

## 📂 โครงสร้างไฟล์สำหรับอ้างอิง
- `backend/src/services/analysisService.js`: ระบบคำนวณพัฒนาการหลัก (Backend)
- `frontend/src/app/page.tsx`: หน้าแรกและการเล่าเรื่อง (Frontend)
- `frontend/src/components/BrainRadarChart.tsx`: Component กราฟรังสี (Frontend)

**Happy Coding!** ฝั่ง Backend ฝากเพื่อนลุย ส่วน Frontend คุณ Nick จัดการ!
