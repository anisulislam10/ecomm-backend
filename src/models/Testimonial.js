const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true
    },
    role: {
        type: String,
        required: [true, 'Please provide a role'],
        trim: true
    },
    company: {
        type: String,
        trim: true,
        default: ''
    },
    content: {
        type: String,
        required: [true, 'Please provide testimonial content'],
        maxlength: [500, 'Testimonial cannot exceed 500 characters']
    },
    rating: {
        type: Number,
        required: [true, 'Please provide a rating'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5'],
        default: 5
    },
    avatar: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Testimonial', testimonialSchema);
