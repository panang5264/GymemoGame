require('dotenv').config();
const mongoose = require('mongoose');

const fixRoles = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;

        // 1. เปลี่ยน "เจ๋ง" (jeng) ให้เป็น user ปกติ
        const jengResult = await db.collection('users').updateOne(
            { name: 'jeng' },
            { $set: { role: 'user' } }
        );
        console.log('✅ jeng -> role: user |', jengResult.modifiedCount, 'updated');

        // 2. เปลี่ยนไอดีเบอร์ 0888888888 ให้เป็น admin (พร้อมตั้ง username = admin)
        const adminResult = await db.collection('users').updateOne(
            { phone: '0888888888' },
            { $set: { role: 'admin', username: 'admin' } }
        );
        console.log('✅ 0888888888 -> role: admin |', adminResult.modifiedCount, 'updated');

        // แสดงสถานะปัจจุบัน
        console.log('\n--- สถานะไอดีทั้งสอง ---');
        const jeng = await db.collection('users').findOne({ name: 'jeng' });
        const admin = await db.collection('users').findOne({ phone: '0888888888' });

        if (jeng) console.log('jeng:', { name: jeng.name, username: jeng.username, role: jeng.role });
        if (admin) console.log('admin:', { name: admin.name, username: admin.username, phone: admin.phone, role: admin.role });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

fixRoles();
