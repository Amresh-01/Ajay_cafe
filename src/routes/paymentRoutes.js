import express from "express";
import {
  verifyPayment,
  getAllPayments,
  getPaymentById,
  createRazorpayOrder,
} from "../controllers/payment.controller.js";
import { protect, admin } from "../middlewares/auth.middleware.js";
import { razorpayWebhook } from "../controllers/paymentWebhook.controller.js";

const router = express.Router();

router.post("/webhook", razorpayWebhook);

router.post("/create", protect, createRazorpayOrder);
router.post("/verify", protect, verifyPayment);

router.get("/all", protect, admin, getAllPayments);
router.get("/:paymentId", protect, getPaymentById);

export default router;
