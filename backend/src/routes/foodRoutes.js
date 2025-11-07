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
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/createFood", protect, upload.single("image"), createFood);
router.get("/AllFoods", getAllFoods);
router.get("/getfoodById/:fooId", protect, getFoodById);
router.put("/updateFood/:foodId", protect, upload.single("image"), updateFood);
router.delete("/deleteFood/:foodId", protect, deleteFood);
router.post("/rate/:id", protect, rateFood);

export default router;
