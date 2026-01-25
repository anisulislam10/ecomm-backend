const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide ad title'],
        trim: true,
        maxlength: [100, 'Ad title cannot be more than 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [200, 'Description cannot be more than 200 characters']
    },
    image: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    link: {
        type: String,
        default: '#'
    },
    type: {
        type: String,
        enum: ['popup', 'banner'],
        default: 'popup'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    displayFrequency: {
        type: Number,
        default: 1, // Number of times to show per session or similar logic
        min: 1
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Ad', adSchema);
