require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const adminUsername = 'admin';
        const existingAdmin = await User.findOne({ username: adminUsername });

        if (existingAdmin) {
            console.log('Admin user already exists. Updating to ensure admin role and password.');
            existingAdmin.role = 'admin';
            existingAdmin.password = 'admin1234';
            await existingAdmin.save();
            console.log('Updated existing user to Admin successfully with password reset.');
        } else {
            const adminUser = new User({
                name: 'System Admin',
                username: adminUsername,
                password: 'admin1234',
                role: 'admin'
            });

            await adminUser.save();
            console.log('Admin user created successfully!');
            console.log('Username: ' + adminUsername);
            console.log('Password: admin1234');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();
