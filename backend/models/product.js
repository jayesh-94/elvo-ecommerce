const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
  },
  images: {
    type: [String],
    required: true,
  },

  colors: {
    type: [String],
  },
  sizes: [String],
  category: {
    type: String,
  },
  stock: {
    type: Number,
    default: 0,
  },
  isFeatured: { type: Boolean, default: false },
  isPopular: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  isChicEssential: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Product", productSchema);
