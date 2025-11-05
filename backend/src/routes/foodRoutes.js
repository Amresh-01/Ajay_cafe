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

const router = express.Router();

router.post("/createFood", upload.single("image"), createFood);
router.get("/AllFoods", getAllFoods);
router.get("/getfoodById/:foodId", getFoodById);
router.put("/updateFood/:foodId", upload.single("image"), updateFood);
router.delete("/deleteFood/:foodId", deleteFood);
router.post("/rate/:foodId", rateFood);

export default router;
