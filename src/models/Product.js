const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide product name'],
        trim: true,
        maxlength: [100, 'Product name cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please provide product description'],
        maxlength: [2000, 'Description cannot be more than 2000 characters']
    },
    price: {
        type: Number,
        required: [true, 'Please provide product price'],
        default: 0
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    images: [{
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    }],
    stock: {
        type: Number,
        required: [true, 'Please provide product stock'],
        default: 0
    },
    ratings: {
        type: Number,
        default: 0
    },
    numOfReviews: {
        type: Number,
        default: 0
    },
    specifications: [
        {
            key: { type: String, required: true },
            value: { type: String, required: true }
        }
    ],
    variants: [{
        size: String,
        color: String,
        price: Number,
        stock: Number
    }],
    discount: {
        type: Number,
        default: 0
    },
    featured: {
        type: Boolean,
        default: false
    },
    isHero: {
        type: Boolean,
        default: false
    },
    brand: {
        type: String,
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

const slugify = require('slugify');

productSchema.pre('save', async function () {
    if (this.isModified('name')) {
        this.slug = slugify(this.name, { lower: true, strict: true });
    }
});

productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
