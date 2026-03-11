# 🚀 Gymemo Admin Deployment Guide

คู่มือฉบับย่อยสำหรับแอดมินในการ Deploy และจัดการระบบข้อมูลล่าสุด

## 1. การอัปเดตระบบ (Update Pipeline)
เมื่อมีการแก้ไขโค้ด (เช่น การเปลี่ยน ID เป็นเบอร์โทรที่เพิ่งทำไป) ให้ทำตามขั้นตอนนี้:

```bash
# 1. ดึงโค้ดล่าสุดจาก Git
git pull origin main

# 2. Rebuild และ Restart Docker Containers
docker-compose down
docker-compose up -d --build
```

## 2. การตรวจสอบฐานข้อมูล (Database Check)
หากคุณต้องการตรวจสอบว่า `guestId` เชื่อมกับ `phone` ถูกต้องไหม ให้เข้า MongoDB Shell:

```javascript
// ค้นหาว่าใครเล่นด่านเยอะที่สุด พร้อมแสดงเบอร์
db.gameanalyses.aggregate([
  { $group: { _id: "$guestId", count: { $sum: 1 } } },
  { $addFields: { userObjId: { $toObjectId: "$_id" } } },
  { $lookup: { from: "users", localField: "userObjId", foreignField: "_id", as: "user" } },
  { $project: { phone: { $arrayElemAt: ["$user.phone", 0] }, activityCount: "$count" } },
  { $sort: { activityCount: -1 } }
])
```

## 3. สิ่งที่ควรระวังขณะพอร์ตข้อมูล (Data Porting)
- **ObjectId Conversion:** ระบบใหม่พยายามแปลง `guestId` (string) เป็น `ObjectId` เพื่อหาเบอร์โทร หากข้อมูลเก่าไม่ใช่รหัสที่มาจาก User ID จริงๆ ระบบจะแสดงเป็น ID เดิมตามปกติ (ไม่พัง)
- **Port Matching:** หน้า Admin Dashboard ใช้พอร์ต 3000 (Frontend) และ 3001 (Backend) อย่าลืมตั้งค่าใน `.env` ของเครื่องที่ Deploy จริง

---
*จัดทำโดย: Antigravity Assistant (AI Pair Programmer)*
