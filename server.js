const dotenv = require('dotenv');
const connectDB = require('./src/config/database');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
});

// Load env vars
dotenv.config();

// Connect to database
console.log('Initiating database connection...');
if (!process.env.MONGODB_URI) {
    console.error('CRITICAL: MONGODB_URI is missing from environment variables!');
}

connectDB().catch(err => {
    console.error('Failed to connect to MongoDB during startup:', err.message);
    // In serverless, we let the function fail or time out rather than forcing exit
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
});

const app = require('./src/app');

const PORT = process.env.PORT || 5000;

// On Vercel, app.listen is often handled by the bridge, but we keep it for local dev
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! 💥');
    console.log(err.name, err.message);
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
});
