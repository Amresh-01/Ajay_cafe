import express from "express";
import {
  createMenuItem,
  getAllMenuItems,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
} from "../controllers/menu.controller.js";

import { protect, admin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create", protect, admin, createMenuItem);
router.get("/getMenu", getAllMenuItems);
router.get("/getMenuById/:id", getMenuItemById);
router.put("/update/:id", protect, admin, updateMenuItem);
router.delete("/delte/:id", protect, admin, deleteMenuItem);

export default router;
