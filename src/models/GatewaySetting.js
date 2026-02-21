const mongoose = require('mongoose');

const gatewaySettingSchema = new mongoose.Schema({
    gateway: {
        type: String,
        required: true,
        unique: true,
        enum: ['stripe', 'paypal', 'cod']
    },
    mode: {
        type: String,
        required: true,
        enum: ['test', 'live'],
        default: 'test'
    },
    testSecretKey: {
        type: String,
        required: false
    },
    testPublishableKey: {
        type: String,
        required: false
    },
    liveSecretKey: {
        type: String,
        required: false
    },
    livePublishableKey: {
        type: String,
        required: false
    },
    testWebhookSecret: {
        type: String,
        required: false
    },
    liveWebhookSecret: {
        type: String,
        required: false
    },
    isActive: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('GatewaySetting', gatewaySettingSchema);
