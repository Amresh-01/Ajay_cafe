import express from "express";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/order.controller.js";
import { protect, admin } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(protect);
router.post("/createOrder", createOrder);
router.get("/allOrders", admin, getAllOrders);
// router.get("/user/:userId", admin, getOrderByUser);
router.get("/:orderId", admin, getOrderById);
router.delete("/:orderId", deleteOrder);
router.route("/status/:orderId").put(protect, admin, updateOrderStatus);

export default router;
