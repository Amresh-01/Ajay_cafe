import express from "express";
import {
  addToCart,
  getMyCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  getCartTotal,
} from "../controllers/cart.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/add", protect, addToCart);
router.get("/MyCart", protect, getMyCart);
router.put("/updateCart", protect, updateCartItem);
router.delete("/remove/:foodId", protect, removeCartItem);
router.get("/total", protect, getCartTotal);
router.delete("/clear", protect, clearCart);

export default router;
