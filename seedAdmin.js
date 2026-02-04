const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');

// Load env vars
dotenv.config();

const createAdmin = async () => {
    try {
        // Connect to DB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB...');

        // Admin Data
        const adminData = {
            name: 'System Admin',
            email: 'admin@avenlybyhuma.com',
            password: 'adminpassword123', // Change this!
            phone: '1234567890',
            role: 'admin',
            isVerified: true
        };

        // Check if admin exists
        const existingAdmin = await User.findOne({ email: adminData.email });
        if (existingAdmin) {
            console.log('Admin already exists. Updating to ensure admin role...');
            existingAdmin.role = 'admin';
            await existingAdmin.save();
            console.log('Admin user updated successfully.');
        } else {
            await User.create(adminData);
            console.log('Admin user created successfully.');
        }

        process.exit();
    } catch (err) {
        console.error('Error seeding admin:', err.message);
        process.exit(1);
    }
};

createAdmin();
