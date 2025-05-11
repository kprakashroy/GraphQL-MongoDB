const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerId: mongoose.Schema.Types.ObjectId,
  products: [
    {
      productId: mongoose.Schema.Types.ObjectId,
      quantity: Number,
      priceAtPurchase: Number
    }
  ],
  totalAmount: Number,
  orderDate: Date,
  status: String
});

module.exports = mongoose.model('Order', orderSchema);
