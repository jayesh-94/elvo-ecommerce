const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const router = express.Router();

const Order = require("../models/order");
const Product = require("../models/product");
const authMiddleware = require("../middleware/auth"); // use your actual auth middleware path/name

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

function normalizeCartItems(items) {
  return Array.isArray(items) ? items : [];
}

async function buildOrderItems(items) {
  const safeItems = normalizeCartItems(items);
  const builtItems = [];
  let totalAmount = 0;

  for (const item of safeItems) {
    const product = await Product.findById(item.productId);
    if (!product) continue;

    const qty = Number(item.qty) || 1;
    const price = Number(product.price) || 0;
    const lineTotal = price * qty;

    totalAmount += lineTotal;

    builtItems.push({
      productId: product._id,
      name: product.name,
      image: Array.isArray(product.images) ? product.images[0] : "",
      price,
      qty,
      size: item.size || "",
      color: item.color || "",
    });
  }

  return { builtItems, totalAmount };
}

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { userId, items, billingDetails, paymentMethod } = req.body;

    const { builtItems, totalAmount } = await buildOrderItems(items);

    if (!builtItems.length) {
      return res.status(400).json({
        success: false,
        message: "No valid products found in cart",
      });
    }

    const order = new Order({
      userId,
      items: builtItems,
      billingDetails,
      paymentMethod: paymentMethod || "Cash On Delivery",
      paymentStatus: "Pending",
      paymentDisplay:
        paymentMethod === "Cash On Delivery" ? "COD" : paymentMethod || "COD",
      status: "Pending",
      totalAmount,
    });

    await order.save();

    return res.json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to place order",
    });
  }
});

router.post("/create-razorpay-order", authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;

    const { builtItems, totalAmount } = await buildOrderItems(items);

    if (!builtItems.length || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart items",
      });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    return res.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      order: razorpayOrder,
      amount: totalAmount,
    });
  } catch (error) {
    console.error("Create Razorpay order error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create Razorpay order",
    });
  }
});

router.post("/verify-payment", authMiddleware, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData,
    } = req.body;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    const { userId, items, billingDetails, paymentMethod } = orderData || {};
    const { builtItems, totalAmount } = await buildOrderItems(items);

    if (!builtItems.length) {
      return res.status(400).json({
        success: false,
        message: "No valid products found in cart",
      });
    }

    const order = new Order({
      userId,
      items: builtItems,
      billingDetails,
      paymentMethod: paymentMethod || "Online Payment",
      paymentStatus: "Prepaid",
      paymentDisplay: "Razorpay",
      status: "Pending",
      totalAmount,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });

    await order.save();

    return res.json({
      success: true,
      message: "Payment verified and order placed",
      order,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
});

router.get("/my", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Load my orders error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load orders",
    });
  }
});

router.put("/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const order = await Order.findOne({ _id: req.params.id, userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status === "Delivered" || order.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "This order cannot be cancelled",
      });
    }

    order.status = "Cancelled";
    await order.save();

    return res.json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel order",
    });
  }
});

module.exports = router;