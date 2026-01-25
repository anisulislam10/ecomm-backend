# E-commerce Backend API

A production-ready RESTful API for an e-commerce application built with Node.js, Express.js, and MongoDB.

## Features

- **Authentication & Authorization**: JWT-based authentication with access and refresh tokens, role-based access control
- **User Management**: User profiles, addresses, and account management
- **Product Management**: Full CRUD operations with filtering, search, and pagination
- **Shopping Cart**: Persistent cart with real-time price calculations
- **Order Processing**: Order creation, tracking, and status updates
- **Payment Integration**: Stripe payment processing with webhooks
- **Reviews & Ratings**: Product reviews with image uploads
- **Email Notifications**: Automated emails for verification, orders, and shipping updates
- **File Upload**: Image uploads via Cloudinary
- **Security**: Helmet, CORS, rate limiting, and input validation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Payment**: Stripe
- **Email**: Nodemailer
- **File Upload**: Cloudinary + Multer
- **Validation**: Joi
- **Security**: Helmet, CORS, express-rate-limit

## Project Structure

```
ecommerce-backend/
├── src/
│   ├── config/         # Configuration files (database, stripe, cloudinary, mailer)
│   ├── middleware/     # Custom middleware (auth, error handler, validation)
│   ├── models/         # Mongoose models
│   ├── controllers/    # Route controllers
│   ├── routes/         # API routes
│   ├── services/       # Business logic services
│   ├── utils/          # Utility functions
│   ├── validations/    # Joi validation schemas
│   ├── constants/      # Constants and messages
│   └── app.js          # Express app setup
├── .env                # Environment variables
├── .gitignore
├── package.json
├── server.js           # Entry point
└── README.md
```

## Installation

1. **Clone the repository**
   ```bash
   cd ecommerce-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory with the following variables:

   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/ecommerce
   JWT_SECRET=your_jwt_secret_key_here
   JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_password
   CLIENT_URL=http://localhost:3000
   NODE_ENV=development
   ```

4. **Start MongoDB**
   
   Make sure MongoDB is running on your system.

5. **Run the application**

   Development mode:
   ```bash
   npm run dev
   ```

   Production mode:
   ```bash
   npm start
   ```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user (requires auth)
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/verify-email` - Verify email with token

### Users

- `GET /api/users/profile` - Get user profile (requires auth)
- `PUT /api/users/profile` - Update user profile (requires auth)
- `GET /api/users/addresses` - Get user addresses (requires auth)
- `POST /api/users/address` - Add new address (requires auth)
- `PUT /api/users/address/:id` - Update address (requires auth)
- `DELETE /api/users/address/:id` - Delete address (requires auth)

### Products

- `GET /api/products` - Get all products (supports filtering, search, pagination)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)
- `GET /api/products/categories` - Get all categories

### Cart

- `GET /api/cart` - Get user cart (requires auth)
- `POST /api/cart/add` - Add item to cart (requires auth)
- `PUT /api/cart/:itemId` - Update cart item quantity (requires auth)
- `DELETE /api/cart/:itemId` - Remove item from cart (requires auth)

### Orders

- `POST /api/orders` - Create new order (requires auth)
- `GET /api/orders/my-orders` - Get user orders (requires auth)
- `GET /api/orders/:id` - Get order by ID (requires auth)
- `PUT /api/orders/:id/pay` - Update order to paid (requires auth)
- `PUT /api/orders/:id/cancel` - Cancel order (requires auth)
- `PUT /api/orders/:id/deliver` - Mark order as delivered (admin only)
- `PUT /api/orders/:id/status` - Update order status (admin only)

### Payment

- `POST /api/payment/create-intent` - Create payment intent (requires auth)
- `POST /api/payment/confirm` - Confirm payment (requires auth)
- `POST /api/payment/webhook` - Stripe webhook handler
- `POST /api/payment/refund` - Create refund (admin only)

### Reviews

- `GET /api/reviews/product/:productId` - Get product reviews
- `POST /api/reviews` - Create review (requires auth)
- `PUT /api/reviews/:id` - Update review (requires auth)
- `DELETE /api/reviews/:id` - Delete review (requires auth)

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Error Handling

The API uses consistent error responses:

```json
{
  "success": false,
  "message": "Error message here",
  "errors": [],
  "stack": "Stack trace (development only)"
}
```

## Security Features

- JWT authentication with refresh tokens
- Password encryption with bcrypt
- Helmet for security headers
- CORS configuration
- Rate limiting (100 requests per hour per IP)
- Input validation and sanitization
- XSS protection

## Testing

For testing the API, you can use:
- Postman
- Thunder Client
- cURL

Import the API endpoints into your preferred tool and start testing!

## Notes

- **Email Configuration**: For development, consider using services like Mailtrap or Ethereal Email
- **Stripe Testing**: Use Stripe test keys and test card numbers for development
- **Cloudinary**: Sign up for a free Cloudinary account to get your credentials
- **MongoDB**: Can use MongoDB Atlas for cloud database or local MongoDB instance

## License

ISC
