
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Order = require('./src/models/Order');

dotenv.config();

async function getAnOrder() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        const order = await Order.findOne().select('_id');
        if (order) {
            console.log('Valid Order ID:', order._id);
        } else {
            console.log('No orders found in database.');
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error fetching order:', err);
        process.exit(1);
    }
}

getAnOrder();
