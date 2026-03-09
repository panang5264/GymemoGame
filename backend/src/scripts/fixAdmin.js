require('dotenv').config();
const mongoose = require('mongoose');

const fixAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;

        // ย้าย admin ให้ใช้ phone='admin' แทน username
        const result = await db.collection('users').updateOne(
            { name: 'System Admin' },
            {
                $set: { phone: 'admin' },
                $unset: { username: '' }
            }
        );
        console.log('Admin user updated:', result.modifiedCount, 'record(s)');

        const admin = await db.collection('users').findOne({ name: 'System Admin' });
        console.log('Admin record:', { name: admin.name, phone: admin.phone, role: admin.role });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

fixAdmin();
