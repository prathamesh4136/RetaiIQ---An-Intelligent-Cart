import express from "express";
import { upload } from "../utils/upload.js";
import verifyFirebaseToken from "../middleware/verifyFirebaseToken.js";
import { registerOrUpdateShop, getShopQR, addCoupon } from "../controllers/sellerController.js";
import Shop from "../models/shopModel.js";

const router = express.Router();

router.post("/register", verifyFirebaseToken, upload.single("logo"), registerOrUpdateShop);

router.get("/profile", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const shop = await Shop.findOne({ ownerId: userId });

    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found for this seller" });
    }
    res.status(200).json({ success: true, shop });
  } catch (err) {
    console.error("Error fetching shop:", err);
    res.status(500).json({ success: false, message: "Server error fetching shop" });
  }
});

// 🆕 POST - Add a new Coupon to the Shop
router.post("/coupon", verifyFirebaseToken, addCoupon);

export default router;