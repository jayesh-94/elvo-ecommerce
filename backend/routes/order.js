const express = require("express");
const router = express.Router();
const Order = require("../models/order");
const Product = require("../models/product");
const User = require("../models/user");
const {
  authMiddleware,
  adminMiddleware,
} = require("../middleware/authMiddleware");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// helper: restore stock for cancelled orders
async function restoreStockForOrder(order) {
  for (const item of order.items || []) {
    if (item.productId && item.qty) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.qty },
      });
    }
  }
}

// helper: payment display
function getPaymentInfo(paymentMethod) {
  const method = String(paymentMethod || "")
    .trim()
    .toLowerCase();

  if (
    method === "cash on delivery" ||
    method === "cod" ||
    method.includes("cash")
  ) {
    return {
      paymentType: "COD",
      paymentStatus: "Unpaid",
      paymentDisplay: "COD (Unpaid)",
    };
  }

  return {
    paymentType: paymentMethod || "Online",
    paymentStatus: "Prepaid",
    paymentDisplay: `${paymentMethod || "Online"} (Prepaid)`,
  };
}

// ADMIN DASHBOARD STATS
router.get(
  "/admin/stats",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const [
        totalProducts,
        totalOrders,
        totalUsers,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
        deliveredRevenueResult,
      ] = await Promise.all([
        Product.countDocuments(),
        Order.countDocuments(),
        User.countDocuments({ role: "user" }),
        Order.countDocuments({ status: "Pending" }),
        Order.countDocuments({ status: "Delivered" }),
        Order.countDocuments({ status: "Cancelled" }),
        Order.aggregate([
          { $match: { status: "Delivered" } },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$totalAmount" },
            },
          },
        ]),
      ]);

      const totalRevenue =
        deliveredRevenueResult.length > 0
          ? deliveredRevenueResult[0].totalRevenue
          : 0;

      res.json({
        success: true,
        stats: {
          totalProducts,
          totalOrders,
          totalUsers,
          pendingOrders,
          deliveredOrders,
          cancelledOrders,
          totalRevenue,
        },
      });
    } catch (err) {
      console.error("Admin stats error:", err);
      res.status(500).json({
        success: false,
        message: "Failed to load dashboard stats",
      });
    }
  },
);

// GET CURRENT USER ORDERS
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
    });
  } catch (err) {
    console.error("Fetch my orders error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
    });
  }
});

// USER CANCEL ORDER
router.put("/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const order = await Order.findOne({ _id: req.params.id, userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status === "Delivered") {
      return res.status(400).json({
        success: false,
        message: "Delivered orders cannot be cancelled",
      });
    }

    if (order.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Order is already cancelled",
      });
    }

    await restoreStockForOrder(order);

    order.status = "Cancelled";
    await order.save();

    res.json({
      success: true,
      message:
        "Order cancelled successfully. Money will be refunded to your payment method within 7 days.",
      order,
    });
  } catch (err) {
    console.error("Cancel order error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to cancel order",
    });
  }
});

// ADMIN GET ALL ORDERS WITH PAGINATION
router.get("/admin", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 20, 1);
    const skip = (page - 1) * limit;

    const totalOrders = await Order.countDocuments();

    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const ordersWithUsers = await Promise.all(
      orders.map(async (order) => {
        const user = await User.findById(order.userId).select(
          "firstName lastName email",
        );

        const paymentInfo = getPaymentInfo(order.paymentMethod);

        return {
          ...order.toObject(),
          userInfo: user
            ? {
                fullName:
                  `${user.firstName || ""} ${user.lastName || ""}`.trim(),
                email: user.email || "",
              }
            : null,
          paymentType: paymentInfo.paymentType,
          paymentStatus: paymentInfo.paymentStatus,
          paymentDisplay: paymentInfo.paymentDisplay,
        };
      }),
    );

    res.json({
      success: true,
      orders: ordersWithUsers,
      pagination: {
        currentPage: page,
        perPage: limit,
        totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
        hasNextPage: page < Math.ceil(totalOrders / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.error("Admin fetch orders error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
    });
  }
});

// ADMIN UPDATE ORDER STATUS
router.put("/:id/status", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "Pending",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status === "Cancelled" && status !== "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled orders cannot be changed to another status",
      });
    }

    if (order.status !== "Cancelled" && status === "Cancelled") {
      await restoreStockForOrder(order);
    }

    order.status = status;
    await order.save();

    res.json({
      success: true,
      message: "Order status updated",
      order,
    });
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
    });
  }
});

// CREATE RAZORPAY ORDER
router.post("/create-razorpay-order", authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    let totalAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      if (product.stock < item.qty) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is out of stock`,
        });
      }

      totalAmount += product.price * item.qty;
    }

    const options = {
      amount: totalAmount * 100, // in paise
      currency: "INR",
      receipt: "order_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID,
      amount: totalAmount,
    });
  } catch (err) {
    console.error("Razorpay order error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create Razorpay order",
    });
  }
});

// VERIFY PAYMENT
router.post("/verify-payment", authMiddleware, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData,
    } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expectedSign !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    const { userId, items, billingDetails } = orderData;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    let totalAmount = 0;
    const verifiedItems = [];

    for (const item of items) {
      const { productId, qty, size, color } = item;

      if (!productId || !qty || qty < 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid cart item data",
        });
      }

      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "One of the products was not found",
        });
      }

      if (product.stock < qty) {
        return res.status(400).json({
          success: false,
          message: `"${product.name}" is out of stock. Please update your cart.`,
        });
      }

      const lineTotal = product.price * qty;
      totalAmount += lineTotal;

      verifiedItems.push({
        productId: product._id.toString(),
        name: product.name,
        price: product.price,
        qty,
        image: product.images?.[0] || "",
        size: size || "",
        color: color || "",
      });
    }

    const newOrder = new Order({
      userId,
      items: verifiedItems,
      billingDetails,
      paymentMethod: "Razorpay",
      paymentStatus: "Paid",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      totalAmount,
      status: "Processing",
    });

    await newOrder.save();

    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.qty },
      });
    }

    res.json({
      success: true,
      message: "Payment successful",
      order: newOrder,
    });
  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
});

// CREATE ORDER
router.post("/", async (req, res) => {
  try {
    const { userId, items, billingDetails, paymentMethod } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    if (!billingDetails) {
      return res.status(400).json({
        success: false,
        message: "Billing details are required",
      });
    }

    const { name, address, city, state, pincode, country, phone, email } =
      billingDetails;

    if (
      !name ||
      !address ||
      !city ||
      !state ||
      !pincode ||
      !country ||
      !phone ||
      !email
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all billing details",
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Payment method is required",
      });
    }

    let totalAmount = 0;
    const verifiedItems = [];

    for (const item of items) {
      const { productId, qty, size, color } = item;

      if (!productId || !qty || qty < 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid cart item data",
        });
      }

      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "One of the products was not found",
        });
      }

      if (product.stock < qty) {
        return res.status(400).json({
          success: false,
          message: `"${product.name}" is out of stock. Please update your cart.`,
        });
      }

      const lineTotal = product.price * qty;
      totalAmount += lineTotal;

      verifiedItems.push({
        productId: product._id.toString(),
        name: product.name,
        price: product.price,
        qty,
        image: product.images?.[0] || "",
        size: size || "",
        color: color || "",
      });
    }

    const order = new Order({
      userId,
      items: verifiedItems,
      billingDetails,
      paymentMethod,
      totalAmount,
      status: "Pending",
    });

    await order.save();

    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.qty },
      });
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (err) {
    console.error("Order placement error:", err);
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
});

module.exports = router;
