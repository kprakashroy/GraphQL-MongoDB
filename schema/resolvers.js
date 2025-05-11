const Order = require('../models/Order');
const Product = require('../models/Product');
const mongoose = require('mongoose');

module.exports = {
  Query: {
    async getCustomerSpending(_, { customerId }) {
      const result = await Order.aggregate([
        { $match: { customerId: mongoose.Types.ObjectId(customerId), status: "completed" } },
        {
          $group: {
            _id: "$customerId",
            totalSpent: { $sum: "$totalAmount" },
            averageOrderValue: { $avg: "$totalAmount" },
            lastOrderDate: { $max: "$orderDate" }
          }
        },
        {
          $project: {
            customerId: "$_id",
            totalSpent: 1,
            averageOrderValue: 1,
            lastOrderDate: 1,
            _id: 0
          }
        }
      ]);
      return result[0];
    },

    async getTopSellingProducts(_, { page, limit }) {
      const skip = (page - 1) * limit;
      const result = await Order.aggregate([
        { $unwind: "$products" },
        { $match: { status: "completed" } },
        {
          $group: {
            _id: "$products.productId",
            totalSold: { $sum: "$products.quantity" }
          }
        },
        { $sort: { totalSold: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product"
          }
        },
        { $unwind: "$product" },
        {
          $project: {
            productId: "$_id",
            name: "$product.name",
            totalSold: 1,
            _id: 0
          }
        }
      ]);
      return result;
    },

    async getSalesAnalytics(_, { startDate, endDate }, { redis }) {
      const cacheKey = `analytics:${startDate}:${endDate}`;
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);

      const result = await Order.aggregate([
        {
          $match: {
            status: "completed",
            orderDate: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          }
        },
        {
          $facet: {
            total: [
              {
                $group: {
                  _id: null,
                  totalRevenue: { $sum: "$totalAmount" },
                  completedOrders: { $sum: 1 }
                }
              }
            ],
            categories: [
              { $unwind: "$products" },
              {
                $lookup: {
                  from: "products",
                  localField: "products.productId",
                  foreignField: "_id",
                  as: "product"
                }
              },
              { $unwind: "$product" },
              {
                $group: {
                  _id: "$product.category",
                  revenue: { $sum: "$products.priceAtPurchase" }
                }
              },
              {
                $project: {
                  category: "$_id",
                  revenue: 1,
                  _id: 0
                }
              }
            ]
          }
        },
        {
          $project: {
            totalRevenue: { $arrayElemAt: ["$total.totalRevenue", 0] },
            completedOrders: { $arrayElemAt: ["$total.completedOrders", 0] },
            categoryBreakdown: "$categories"
          }
        }
      ]);

      await redis.set(cacheKey, JSON.stringify(result[0]), 'EX', 60);
      return result[0];
    }
  },

  Mutation: {
    async createOrder(_, { customerId, products, totalAmount, status }) {
      try {
        await Order.create({
          customerId: mongoose.Types.ObjectId(customerId),
          products: products.map(p => ({
            productId: mongoose.Types.ObjectId(p.productId),
            quantity: p.quantity,
            priceAtPurchase: p.priceAtPurchase
          })),
          totalAmount,
          orderDate: new Date(),
          status
        });
        return true;
      } catch (err) {
        console.error(err);
        return false;
      }
    }
  }
};