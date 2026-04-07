// controllers/sellerController.js
import Shop from "../models/shopModel.js";
import path from "path";

export const registerOrUpdateShop = async (req, res) => {
  try {
    const { shopName, ownerName, mobile, address, shopType, gstNumber, upiId, openingHours, description } = req.body;
    const userId = req.user.uid;
    const logoPath = req.file ? `/uploads/${req.file.filename}` : null;

    let shop = await Shop.findOne({ ownerId: userId });

    if (shop) {
      shop.name = shopName;
      shop.address = address;
      shop.type = shopType;
      shop.mobile = mobile;
      shop.upiId = upiId;
      shop.gstNumber = gstNumber || shop.gstNumber;
      shop.openTime = openingHours?.split("-")[0]?.trim() || shop.openTime;
      shop.closeTime = openingHours?.split("-")[1]?.trim() || shop.closeTime;
      shop.logo = logoPath || shop.logo;
      await shop.save();
    } else {
      shop = new Shop({
        ownerId: userId,
        name: shopName,
        address,
        type: shopType,
        mobile,
        upiId,
        gstNumber,
        openTime: openingHours?.split("-")[0]?.trim(),
        closeTime: openingHours?.split("-")[1]?.trim(),
        logo: logoPath,
      });
      await shop.save();
    }

    return res.status(201).json({ success: true, message: "Shop setup completed successfully", shop });
  } catch (err) {
    console.error("Error registering shop:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to register shop" });
  }
};

export const getShopQR = async (req, res) => {
  try {
    const shopId = req.params.shopId;
    const shopURL = `${process.env.FRONTEND_BASE_URL}/shop/${shopId}`;
    res.status(200).json({ success: true, qrURL: shopURL, link: shopURL });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error generating QR" });
  }
};

// 🆕 NEW: Add Coupon Logic
export const addCoupon = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { code, discountPercent } = req.body;

    if (!code || !discountPercent) {
      return res.status(400).json({ success: false, message: "Code and discount are required" });
    }

    const shop = await Shop.findOneAndUpdate(
      { ownerId: userId },
      { $push: { coupons: { code: code.toUpperCase(), discountPercent } } },
      { new: true }
    );

    if (!shop) return res.status(404).json({ success: false, message: "Shop not found" });

    res.json({ success: true, shop });
  } catch (err) {
    console.error("Error adding coupon:", err);
    res.status(500).json({ success: false, message: "Server error adding coupon" });
  }
};