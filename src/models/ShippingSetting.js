const mongoose = require('mongoose');

const shippingSettingSchema = new mongoose.Schema({
    shippingFee: {
        type: Number,
        required: true,
        default: 15
    },
    freeShippingThreshold: {
        type: Number,
        required: true,
        default: 100
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('ShippingSetting', shippingSettingSchema);
