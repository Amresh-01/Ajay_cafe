import express from "express";
import {
  createOrder,
  verifyPayment,
  getAllPayments,
  getPaymentById,
  createRazorpayOrder,
} from "../controllers/payment.controller.js";
import { admin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/RazorpayOrder", createRazorpayOrder);
router.post("/verify", verifyPayment);
router.get("/all", admin, getAllPayments);
router.get("/:paymentId", getPaymentById);

export default router;
