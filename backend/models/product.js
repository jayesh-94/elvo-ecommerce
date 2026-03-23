const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    description: {
      type: String,
      trim: true,
    },

    // Cloudinary URLs will be stored here
    images: {
      type: [String],
      required: true,
    },

    colors: {
      type: [String],
      default: [],
    },

    sizes: {
      type: [String],
      default: [],
    },

    category: {
      type: String,
      trim: true,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Homepage flags
    isFeatured: { type: Boolean, default: false },
    isPopular: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    isChicEssential: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
  },
  {
    timestamps: true, // 🔥 better than manual createdAt
  }
);

module.exports = mongoose.model("Product", productSchema);