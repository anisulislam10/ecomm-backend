const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
exports.getStats = asyncHandler(async (req, res, next) => {
    const [totalUsers, totalOrders, totalProducts, totalCategories, orders] = await Promise.all([
        User.countDocuments({}),
        Order.countDocuments({}),
        Product.countDocuments({}),
        Category.countDocuments({}),
        Order.find({ isPaid: true })
    ]);

    const totalRevenue = orders.reduce((acc, order) => acc + (order.totalPrice || 0), 0);

    // Get recent orders
    const recentOrders = await Order.find({})
        .populate('user', 'name email')
        .sort('-createdAt')
        .limit(5);

    // Get basic sales data by month (last 6 months - simplified)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const salesData = await Order.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo }, isPaid: true } },
        {
            $group: {
                _id: { $month: "$createdAt" },
                revenue: { $sum: "$totalPrice" },
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id": 1 } }
    ]);

    res.status(200).json(new ApiResponse(200, {
        stats: {
            totalUsers,
            totalOrders,
            totalProducts,
            totalCategories,
            totalRevenue
        },
        recentOrders,
        salesData
    }));
});

/**
 * @desc    Get analytics data (daily, weekly, monthly)
 * @route   GET /api/admin/analytics
 * @access  Private/Admin
 */
exports.getAnalytics = asyncHandler(async (req, res, next) => {
    const { period = 'daily', days = 30 } = req.query;

    const now = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Daily Revenue Chart
    const dailyData = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate },
                isPaid: true
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" },
                    day: { $dayOfMonth: "$createdAt" }
                },
                revenue: { $sum: "$totalPrice" },
                orders: { $sum: 1 }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    // Weekly Data
    const weeklyData = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate },
                isPaid: true
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: "$createdAt" },
                    week: { $week: "$createdAt" }
                },
                revenue: { $sum: "$totalPrice" },
                orders: { $sum: 1 }
            }
        },
        { $sort: { "_id.year": 1, "_id.week": 1 } }
    ]);

    // Monthly Data (last 12 months)
    const yearAgo = new Date();
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);

    const monthlyData = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: yearAgo },
                isPaid: true
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" }
                },
                revenue: { $sum: "$totalPrice" },
                orders: { $sum: 1 }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Sales by Category
    const categoryStats = await Order.aggregate([
        { $match: { isPaid: true } },
        { $unwind: "$items" },
        {
            $lookup: {
                from: "products",
                localField: "items.product",
                foreignField: "_id",
                as: "productInfo"
            }
        },
        { $unwind: "$productInfo" },
        {
            $lookup: {
                from: "categories",
                localField: "productInfo.category",
                foreignField: "_id",
                as: "categoryInfo"
            }
        },
        { $unwind: "$categoryInfo" },
        {
            $group: {
                _id: "$categoryInfo.name",
                revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
                count: { $sum: "$items.quantity" }
            }
        },
        { $sort: { revenue: -1 } }
    ]);

    // Top Products
    const topProducts = await Order.aggregate([
        { $match: { isPaid: true } },
        { $unwind: "$items" },
        {
            $group: {
                _id: "$items.product",
                totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
                totalQuantity: { $sum: "$items.quantity" }
            }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 },
        {
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "_id",
                as: "product"
            }
        },
        { $unwind: "$product" }
    ]);

    // Order Status Breakdown
    const statusBreakdown = await Order.aggregate([
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 }
            }
        }
    ]);

    // Customer Growth (last 30 days)
    const customerGrowth = await User.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" },
                    day: { $dayOfMonth: "$createdAt" }
                },
                newCustomers: { $sum: 1 }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    // Calculate growth percentages
    const last30Days = await Order.countDocuments({
        createdAt: { $gte: startDate }
    });

    const previous30Days = new Date(startDate);
    previous30Days.setDate(previous30Days.getDate() - parseInt(days));

    const previousPeriodOrders = await Order.countDocuments({
        createdAt: { $gte: previous30Days, $lt: startDate }
    });

    const ordersGrowth = previousPeriodOrders > 0
        ? ((last30Days - previousPeriodOrders) / previousPeriodOrders * 100).toFixed(1)
        : 0;

    const revenueThis = dailyData.reduce((sum, d) => sum + d.revenue, 0);
    const previousRevenue = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: previous30Days, $lt: startDate },
                isPaid: true
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: "$totalPrice" }
            }
        }
    ]);

    const revenueGrowth = previousRevenue[0]?.total > 0
        ? ((revenueThis - previousRevenue[0].total) / previousRevenue[0].total * 100).toFixed(1)
        : 0;

    res.status(200).json(new ApiResponse(200, {
        dailyData,
        weeklyData,
        monthlyData,
        categoryStats,
        topProducts,
        statusBreakdown,
        customerGrowth,
        growth: {
            orders: ordersGrowth,
            revenue: revenueGrowth
        }
    }));
});
