# MongoDB Schema Documentation

## Collections

### 1. Users Collection

เก็บข้อมูลผู้ใช้ในระบบ

#### Fields

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| _id | ObjectId | ✅ | ✅ | Primary key |
| name | String | ✅ | ❌ | ชื่อผู้ใช้ (max 50 ตัวอักษร) |
| phone | String | ✅ | ✅ | เบอร์โทรศัพท์ (รูปแบบ 0xxxxxxxxx) |
| password | String | ✅ | ❌ | รหัสผ่าน (hashed ด้วย bcrypt, min 6 ตัวอักษร) |
| highScore | Number | ❌ | ❌ | คะแนนสูงสุด (default: 0) |
| createdAt | Date | ✅ | ❌ | วันที่สร้าง (auto) |
| updatedAt | Date | ✅ | ❌ | วันที่อัปเดต (auto) |

#### Indexes
- `phone` (unique index)

#### Validation
- phone: ต้องเป็นรูปแบบ `0\d{9}` (เบอร์ไทย 10 หลัก)
- password: min length 6 ตัวอักษร
- name: max length 50 ตัวอักษร

---

### 2. Scores Collection

เก็บประวัติคะแนนการเล่นเกมของผู้ใช้

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | ObjectId | ✅ | Primary key |
| user | ObjectId | ✅ | Reference to Users._id |
| score | Number | ✅ | คะแนนที่ได้ (min: 0) |
| moves | Number | ✅ | จำนวนครั้งที่เปิดการ์ด (min: 0) |
| timeTaken | Number | ✅ | เวลาที่ใช้ (วินาที, min: 0) |
| createdAt | Date | ✅ | วันที่บันทึกคะแนน (auto) |
| updatedAt | Date | ✅ | วันที่อัปเดต (auto) |

#### Indexes
- `user` (index for faster queries)
- Compound index: `{ score: -1, timeTaken: 1 }` (for leaderboard)

#### Validation
- score, moves, timeTaken: ต้อง >= 0

---

## Relationships

```
Users (1) ----< (many) Scores
```

- 1 User สามารถมีหลาย Scores
- แต่ละ Score ต้องมี 1 User เท่านั้น

---

## Seed Data

ใช้คำสั่ง `npm run seed` ใน backend directory เพื่อสร้างข้อมูลตัวอย่าง:
- 3 Users (สมชาย, สมหญิง, น้องเกม)
- 5 Score records

### Login Credentials (หลัง seed)
- เบอร์: `0812345678` / รหัส: `123456` (สมชาย)
- เบอร์: `0823456789` / รหัส: `123456` (สมหญิง)
- เบอร์: `0834567890` / รหัส: `123456` (น้องเกม)
