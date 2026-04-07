import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
  items: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      name: String,
      price: Number,
      quantity: Number,
    },
  ],
  totalAmount: { type: Number, required: true },
  
  // 🆕 Added "online" to the enum to support Razorpay card/netbanking payments
  paymentMethod: { type: String, enum: ["upi", "cash", "online"], required: true },
  
  paymentStatus: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending",
  },

  // 🆕 Razorpay specific fields
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Order", orderSchema);