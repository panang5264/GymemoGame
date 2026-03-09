require('dotenv').config();
const mongoose = require('mongoose');

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;
        const users = await db.collection('users').find({}).toArray();

        console.log('Database Name:', mongoose.connection.name);
        console.log('Collection Name: users');
        console.log('Total Users Found:', users.length);

        users.forEach(u => {
            console.log('---------------------------');
            console.log('ID:', u._id);
            console.log('Name:', u.name);
            console.log('Username:', u.username);
            console.log('Phone:', u.phone); // check if old field still there
            console.log('Role:', u.role);
        });

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkUsers();
