const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const Product = require('./src/models/Product');
        const products = await Product.find({}, { name: 1, slug: 1, _id: 1 });
        console.log('Products:', JSON.stringify(products, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

check();
