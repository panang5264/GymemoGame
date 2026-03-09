require('dotenv').config();
const mongoose = require('mongoose');

const fixRoles = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;

        // หาไอดีที่มี username = 'admin' หรือ เคยมี phone = '0888888888'
        // และเปลี่ยน role กลับเป็น user ธรรมดา (แต่ไม่เอา System Admin)
        const result = await db.collection('users').updateMany(
            {
                name: { $ne: 'System Admin' }, // ไม่แตะ System Admin
                role: 'admin'                  // ทุกคนที่เป็น admin ที่ไม่ใช่ System Admin
            },
            { $set: { role: 'user' } }
        );
        console.log(`✅ เปลี่ยนกลับเป็น user: ${result.modifiedCount} ไอดี`);

        // แสดงผลสรุป
        const admins = await db.collection('users').find({ role: 'admin' }).toArray();
        console.log('\n--- Admin ที่เหลืออยู่ ---');
        admins.forEach(u => console.log(`  - ${u.name} (${u.username || u.phone}) role: ${u.role}`));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

fixRoles();
