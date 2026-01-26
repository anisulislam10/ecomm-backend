const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
    identifier: {
        type: String,
        required: true,
        unique: true,
        default: 'home_page'
    },
    heroSection: {
        title: { type: String, default: 'Avenly by Huma' },
        subtitle: { type: String, default: 'Artifacts of Refinement' }
    },
    collectiveIndex: {
        title: { type: String, default: 'Artifacts of Refinement' },
        description: { type: String, default: 'Explore our curated ledger of professional-grade essentials. Each piece is verified for origin, quality, and aesthetic longevity.' },
        buttonText: { type: String, default: 'Browse Collective' },
        image: { type: String, default: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=2000' }
    },
    siteSettings: {
        siteName: { type: String, default: 'Avenly by Huma.' },
        seoKeywords: { type: String, default: 'luxury, ecommerce, artifacts' },
        logoUrl: { type: String, default: '' }
    },
    latestAdditions: {
        count: { type: Number, default: 6, max: 20 }
    },
    flashSale: {
        enabled: { type: Boolean, default: true },
        endTime: { type: Date },
        title: { type: String, default: 'Flash Artifacts' },
        subtitle: { type: String, default: 'Limited Availability' },
        products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
    },
    footer: {
        description: { type: String, default: 'Curating premium essentials for your modern lifestyle. Quality meets aesthetic in every piece we offer.' },
        socialLinks: {
            facebook: { type: String, default: '#' },
            twitter: { type: String, default: '#' },
            instagram: { type: String, default: '#' },
            github: { type: String, default: '#' }
        },
        newsletterText: { type: String, default: 'Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.' },
        copyrightText: { type: String, default: '© 2024 Avenly by Huma E-Commerce. All rights reserved.' }
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Content', contentSchema);
