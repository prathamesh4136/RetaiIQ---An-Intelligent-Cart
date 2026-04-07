import express from "express";
import crypto from "crypto"; // 🆕 Built into Node.js, needed to verify payment security
import Razorpay from "razorpay"; // 🆕 Import Razorpay SDK
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import Shop from "../models/shopModel.js";

const router = express.Router();

// 🆕 Initialize Razorpay instance (Make sure to add keys to your .env file)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Always return JSON responses
router.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  next();
});

/**
 * 🆕 NEW ROUTE: Initialize Payment
 * POST /api/shops/:shopId/init-payment
 * Called right before the user opens the payment modal.
 */
router.post("/:shopId/init-payment", async (req, res) => {
  try {
    const { totalAmount } = req.body;

    if (!totalAmount) {
      return res.status(400).json({ success: false, message: "Total amount is required" });
    }

    const options = {
      amount: Math.round(totalAmount * 100), // Razorpay expects amount in paise (multiply by 100)
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json({ success: true, order_id: order.id, currency: order.currency, amount: order.amount });
  } catch (error) {
    console.error("Error initializing Razorpay:", error);
    res.status(500).json({ success: false, message: "Unable to initialize payment" });
  }
});

/**
 * 🛠️ MODIFIED ROUTE: Create a new order & verify payment
 * POST /api/shops/:shopId/order
 */
router.post("/:shopId/order", async (req, res) => {
  try {
    const { shopId } = req.params;
    
    // 🆕 We now accept razorpay IDs and signature from the frontend
    const { 
      items, 
      totalAmount, 
      paymentMethod, 
      razorpayOrderId, 
      razorpayPaymentId, 
      razorpaySignature 
    } = req.body;

    console.log("New order received for shop:", shopId);

    // Validate
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Order items missing" });
    }

    const shop = await Shop.findById(shopId);
    if (!shop) return res.status(404).json({ success: false, message: "Shop not found" });

    // 🆕 Security Check: If payment is online, verify the Razorpay signature
    if (paymentMethod === "online" || paymentMethod === "upi") {
      const body = razorpayOrderId + "|" + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== razorpaySignature) {
        return res.status(400).json({ success: false, message: "Invalid payment signature! Payment failed." });
      }
    }

    // ✅ Create new order
    const order = await Order.create({
      shopId,
      items,
      totalAmount,
      paymentMethod,
      // 🆕 Update status based on verified online payment
      paymentStatus: (paymentMethod === "online" || paymentMethod === "upi") ? "paid" : "pending",
      razorpayOrderId,     // 🆕 Save to DB (Make sure to add these to orderModel.js)
      razorpayPaymentId    // 🆕 Save to DB
    });

    // ✅ Reduce product stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item._id, {
        $inc: { stock: -item.quantity },
      });
    }

    console.log(`Order created for ${shop.name}: ${order._id}`);
    return res.json({
      success: true,
      message: paymentMethod === "cash"
          ? "Order placed successfully (Cash Payment Pending)"
          : "Order placed successfully (Paid Online)",
      order,
    });
  } catch (err) {
    console.error("Error creating order:", err);
    return res.status(500).json({ success: false, message: "Server error creating order" });
  }
});

/**
 * ✅ Get all orders for a specific shop (for seller dashboard)
 * GET /api/shops/:shopId/orders
 */
router.get("/:shopId/orders", async (req, res) => {
  try {
    const { shopId } = req.params;
    const orders = await Order.find({ shopId }).sort({ createdAt: -1 });
    return res.json({ success: true, orders });
  } catch (err) {
    console.error("Error fetching orders:", err);
    return res.status(500).json({ success: false, message: "Server error fetching orders" });
  }
});

/**
 * ✅ Mark a cash order as paid
 * PUT /api/shops/orders/:orderId/mark-paid
 */
router.put("/orders/:orderId/mark-paid", async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.paymentMethod !== "cash") {
      return res.status(400).json({ success: false, message: "Only cash orders can be marked as paid" });
    }

    order.paymentStatus = "paid";
    await order.save();

    console.log(`Order ${orderId} marked as paid`);
    return res.json({ success: true, message: "Order marked as paid", order });
  } catch (err) {
    console.error("Error marking order paid:", err);
    return res.status(500).json({ success: false, message: "Server error marking order paid" });
  }
});

export default router;