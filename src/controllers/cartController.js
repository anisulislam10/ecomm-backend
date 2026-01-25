const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/apiResponse');
const messages = require('../constants/messages');

/**
 * @desc    Get user cart
 * @route   GET /api/cart
 * @access  Private
 */
exports.getCart = asyncHandler(async (req, res, next) => {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

    if (!cart) {
        cart = await Cart.create({ user: req.user._id, items: [] });
    }

    res.status(200).json(new ApiResponse(200, { cart }));
});

/**
 * @desc    Add item to cart
 * @route   POST /api/cart/add
 * @access  Private
 */
exports.addToCart = asyncHandler(async (req, res, next) => {
    console.log('addToCart reached', req.body);
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
        return next(new ApiError(404, messages.PRODUCT_NOT_FOUND));
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        cart = await Cart.create({
            user: req.user._id,
            items: [{ product: productId, quantity, price: product.price }]
        });
    } else {
        // Check if item already exists
        const itemIndex = cart.items.findIndex(
            (item) => item.product.toString() === productId
        );

        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
        } else {
            cart.items.push({ product: productId, quantity, price: product.price });
        }
    }

    // Calculate total
    cart.totalPrice = cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    await cart.save();
    await cart.populate('items.product');

    res.status(200).json(new ApiResponse(200, { cart }, messages.ITEM_ADDED_TO_CART));
});

/**
 * @desc    Update cart item quantity
 * @route   PUT /api/cart/:itemId
 * @access  Private
 */
exports.updateCartItem = asyncHandler(async (req, res, next) => {
    const { quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
        return next(new ApiError(404, 'Cart not found'));
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
        return next(new ApiError(404, 'Item not found in cart'));
    }

    item.quantity = quantity;

    // Calculate total
    cart.totalPrice = cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    await cart.save();
    await cart.populate('items.product');

    res.status(200).json(new ApiResponse(200, { cart }, messages.CART_UPDATED));
});

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/:itemId
 * @access  Private
 */
exports.removeFromCart = asyncHandler(async (req, res, next) => {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
        return next(new ApiError(404, 'Cart not found'));
    }

    cart.items = cart.items.filter((item) => item._id.toString() !== req.params.itemId);

    // Calculate total
    cart.totalPrice = cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    await cart.save();
    await cart.populate('items.product');

    res.status(200).json(new ApiResponse(200, { cart }, messages.ITEM_REMOVED_FROM_CART));
});
