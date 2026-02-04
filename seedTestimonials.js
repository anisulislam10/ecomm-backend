const mongoose = require('mongoose');
const Testimonial = require('./src/models/Testimonial');
require('dotenv').config();

const testimonials = [
    {
        name: 'Sophia Martinez',
        role: 'Interior Designer',
        company: 'Luxe Living Studio',
        content: 'The quality of these linens exceeded my expectations. They\'ve transformed my bedroom into a sanctuary. The eco-friendly approach is a bonus I truly appreciate.',
        rating: 5,
        avatar: 'https://i.pravatar.cc/150?img=1',
        isActive: true
    },
    {
        name: 'James Chen',
        role: 'Hotel Manager',
        company: 'The Grand Heritage',
        content: 'We\'ve outfitted our entire boutique hotel with Yumeko linens. Our guests constantly comment on the exceptional comfort and elegant aesthetic.',
        rating: 5,
        avatar: 'https://i.pravatar.cc/150?img=13',
        isActive: true
    },
    {
        name: 'Emily Thompson',
        role: 'Sustainability Consultant',
        company: '',
        content: 'Finally, luxury bedding that doesn\'t compromise on environmental values. The organic materials and ethical production make me feel good about my purchase.',
        rating: 5,
        avatar: 'https://i.pravatar.cc/150?img=5',
        isActive: true
    },
    {
        name: 'Marcus Williams',
        role: 'Architect',
        company: 'Williams & Associates',
        content: 'The minimalist design and natural textures perfectly complement my modern aesthetic. These pieces are both functional art and supreme comfort.',
        rating: 5,
        avatar: 'https://i.pravatar.cc/150?img=12',
        isActive: true
    },
    {
        name: 'Isabella Rodriguez',
        role: 'Wellness Coach',
        company: 'Mindful Living',
        content: 'Sleep quality has improved dramatically since switching to these linens. The breathable fabric and soothing colors create the perfect environment for rest.',
        rating: 5,
        avatar: 'https://i.pravatar.cc/150?img=9',
        isActive: true
    },
    {
        name: 'David Park',
        role: 'Chef & Restaurateur',
        company: 'The Refined Table',
        content: 'Just as I\'m meticulous about ingredients, I\'m particular about my sleep environment. These linens are crafted with the same attention to quality I demand.',
        rating: 5,
        avatar: 'https://i.pravatar.cc/150?img=14',
        isActive: true
    },
    {
        name: 'Olivia Bennett',
        role: 'Fashion Buyer',
        company: 'Bennett Collective',
        content: 'The tactile experience is unmatched. Natural, luxurious, and effortlessly sophisticated—exactly what I look for in premium textiles.',
        rating: 5,
        avatar: 'https://i.pravatar.cc/150?img=10',
        isActive: true
    }
];

const seedTestimonials = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected for testimonial seeding...');

        // Clear existing testimonials
        await Testimonial.deleteMany({});
        console.log('Existing testimonials cleared.');

        // Insert new testimonials
        await Testimonial.insertMany(testimonials);
        console.log('7 testimonials seeded successfully!');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding testimonials:', error);
        process.exit(1);
    }
};

seedTestimonials();
