import express from "express";
import {
  createFood,
  getAllFoods,
  getFoodById,
  updateFood,
  deleteFood,
  rateFood,
} from "../controllers/food.controller.js";
import upload from "../middlewares/multer.middleware.js";
import { protect, admin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/createFood", protect, admin, upload.single("image"), createFood);
router.get("/AllFoods", getAllFoods);
router.get("/getfoodById/:foodId", protect, getFoodById);
router.put(
  "/updateFood/:foodId",
  protect,
  admin,
  upload.single("image"),
  updateFood
);
router.delete("/deleteFood/:foodId", protect, admin, deleteFood);
router.post("/rate/:id", protect, rateFood);

export default router;
