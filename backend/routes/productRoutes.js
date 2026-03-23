const express = require("express");
const router = express.Router();
const multer = require("multer");
const Product = require("../models/product");
const { storage } = require("../config/cloudinary");

const upload = multer({ storage });

// =====================
// HOME SECTIONS (FLAGS)
// =====================

// Chic Essentials (swiper)
router.get("/home/chic-essentials", async (req, res) => {
  try {
    const products = await Product.find({ isChicEssential: true })
      .sort({ createdAt: -1 })
      .limit(12);

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// New Arrivals (swiper)
router.get("/home/new-arrivals", async (req, res) => {
  try {
    const products = await Product.find({ isNewArrival: true })
      .sort({ createdAt: -1 })
      .limit(12);

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Featured / Popular / Trending (tabs)
router.get("/type/:type", async (req, res) => {
  try {
    const type = req.params.type;

    const map = {
      featured: { isFeatured: true },
      popular: { isPopular: true },
      trending: { isTrending: true },
    };

    const filter = map[type];
    if (!filter) return res.status(400).json({ message: "Invalid type" });

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .limit(12);

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================================
// SEARCH PRODUCTS (by name) WITH PAGINATION
// GET /api/products/search?q=shirt&page=1&limit=80
// ================================
router.get("/search", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 50, 1);
    const skip = (page - 1) * limit;

    if (!q) {
      return res.json({
        products: [],
        totalProducts: 0,
        currentPage: page,
        totalPages: 0,
      });
    }

    const filter = {
      name: { $regex: q, $options: "i" },
    };

    const totalProducts = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      products,
      totalProducts,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
    });
  } catch (err) {
    res.status(500).json({ message: "Search failed", error: err.message });
  }
});

// showcase section
router.get("/home/showcase", async (req, res) => {
  try {
    const caps = await Product.find({ category: "caps" })
      .sort({ createdAt: -1 })
      .limit(3);

    const sunglasses = await Product.find({ category: "sunglasses" })
      .sort({ createdAt: -1 })
      .limit(3);

    const bags = await Product.find({ category: "bags" })
      .sort({ createdAt: -1 })
      .limit(3);

    const jewellery = await Product.find({ category: "jewellery" })
      .sort({ createdAt: -1 })
      .limit(3);

    res.json({ caps, sunglasses, bags, jewellery });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================================
// CREATE PRODUCT
// ================================
router.post("/", upload.array("images", 5), async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      category,
      stock,
      colors,
      sizes,
      isFeatured,
      isPopular,
      isTrending,
      isChicEssential,
      isNewArrival,
    } = req.body;

    const newProduct = new Product({
      name,
      price,
      description,
      category,
      stock,
      images: req.files ? req.files.map((file) => file.path) : [],
      colors: colors ? colors.split(",").map((c) => c.trim()) : [],
      sizes: sizes ? sizes.split(",").map((s) => s.trim()) : [],
      isFeatured: isFeatured === "true",
      isPopular: isPopular === "true",
      isTrending: isTrending === "true",
      isChicEssential: isChicEssential === "true",
      isNewArrival: isNewArrival === "true",
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({
      message: "Error creating product",
      error: error.message,
    });
  }
});

// ================================
// GET ALL PRODUCTS WITH PAGINATION
// GET /api/products?page=1&limit=80
// ================================
router.get("/", async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 80, 1);
    const skip = (page - 1) * limit;

    const totalProducts = await Product.countDocuments();

    const products = await Product.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      products,
      totalProducts,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ================================
// GET SINGLE PRODUCT
// ================================
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ================================
// UPDATE PRODUCT
// ================================
router.put("/:id", upload.array("images", 5), async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      category,
      stock,
      colors,
      sizes,
      isFeatured,
      isPopular,
      isTrending,
      isChicEssential,
      isNewArrival,
    } = req.body;

    const updateData = {
      name,
      price,
      description,
      category,
      stock,
      colors: colors ? colors.split(",").map((c) => c.trim()) : [],
      sizes: sizes ? sizes.split(",").map((s) => s.trim()) : [],
      isFeatured: isFeatured === "true",
      isPopular: isPopular === "true",
      isTrending: isTrending === "true",
      isChicEssential: isChicEssential === "true",
      isNewArrival: isNewArrival === "true",
    };

    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map((file) => file.path);
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({
      message: "Error updating product",
      error: error.message,
    });
  }
});

// ================================
// DELETE PRODUCT
// ================================
router.delete("/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;