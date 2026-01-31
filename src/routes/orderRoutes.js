import express from "express";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getUserOrders,
  getAnalytics,
} from "../controllers/order.controller.js";
import { protect, admin } from "../middlewares/auth.middleware.js";
import Order from "../models/order.model.js";

const router = express.Router();
router.use(protect);

router.post("/createOrder", createOrder);
router.get("/userorder", getUserOrders);

router.get("/allOrders", admin, getAllOrders);
router.get("/analytics", admin, getAnalytics);
router.get("/kds", protect, admin, async (req, res) => {
  const orders = await Order.find({
    status: { $in: ["pending", "preparing"] },
  })
    .sort({ createdAt: 1 })
    .populate("items.food");

  res.json({
    success: true,
    data: orders,
  });
});

router.delete("/deleteOrder/:orderId", deleteOrder);
router.get("/:orderId", getOrderById);
router.delete("/:orderId", admin, deleteOrder);
router.put("/status/:orderId", admin, updateOrderStatus);

export default router;
