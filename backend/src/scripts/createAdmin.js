require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

const createAdmin = async () => {
    try {
        const adminPhone = 'admin';
        const existingAdmin = await User.findOne({ phone: adminPhone });

        if (existingAdmin) {
            console.log('Admin user already exists. Updating to ensure admin role and password.');
            existingAdmin.role = 'admin';
            existingAdmin.password = 'admin1234';
            await existingAdmin.save();
            console.log('Updated existing user to Admin successfully with password reset.');
        } else {
            const adminUser = new User({
                name: 'System Admin',
                phone: adminPhone,
                password: 'admin1234',
                role: 'admin'
            });

            await adminUser.save();
            console.log('Admin user created successfully!');
            console.log('Phone: ' + adminPhone);
            console.log('Password: admin1234');
        }
    } catch (error) {
        console.error('Error creating admin:', error);
    }
};

module.exports = createAdmin;
