const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: String,

  items: [
    {
      productId: String,
      name: String,
      price: Number,
      qty: Number,
      image: String,
      size: String,
      color: String,
    },
  ],

  billingDetails: {
    name: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    country: String,
    phone: String,
    email: String,
  },

  paymentMethod: String,

  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed", "Refunded", "Unpaid"],
    default: "Pending",
  },

  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,

  totalAmount: Number,

  status: {
    type: String,
    enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
    default: "Pending",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Order", orderSchema);
