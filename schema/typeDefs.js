const { gql } = require('apollo-server-express');

module.exports = gql`
  type CustomerSpending {
    customerId: ID!
    totalSpent: Float
    averageOrderValue: Float
    lastOrderDate: String
  }

  type TopProduct {
    productId: ID!
    name: String!
    totalSold: Int
  }

  type CategoryRevenue {
    category: String!
    revenue: Float!
  }

  type SalesAnalytics {
    totalRevenue: Float
    completedOrders: Int
    categoryBreakdown: [CategoryRevenue]
  }

  input OrderProductInput {
    productId: ID!
    quantity: Int!
    priceAtPurchase: Float!
  }

  type Query {
    getCustomerSpending(customerId: ID!): CustomerSpending
    getTopSellingProducts(page: Int!, limit: Int!): [TopProduct]
    getSalesAnalytics(startDate: String!, endDate: String!): SalesAnalytics
  }

  type Mutation {
    createOrder(
      customerId: ID!
      products: [OrderProductInput!]!
      totalAmount: Float!
      status: String!
    ): Boolean
  }
`;