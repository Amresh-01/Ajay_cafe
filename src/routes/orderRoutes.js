import express from "express";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getUserOrders,
} from "../controllers/order.controller.js";
import { protect, admin } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(protect);

router.post("/createOrder", createOrder);router.get("/userorder", getUserOrders);


router.get("/allOrders", admin, getAllOrders);
router.get("/:orderId", admin, getOrderById);
router.delete("/:orderId", admin, deleteOrder);
router.put("/status/:orderId", admin, updateOrderStatus);

export default router;
