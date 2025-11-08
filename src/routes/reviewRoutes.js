import express from "express";
import {
  createReview,
  getReviewsByFood,
  updateReview,
  deleteReview,
} from "../controllers/review.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/allReviews/:foodId", getReviewsByFood);

router.use(protect);

router.post("/createReview", createReview);
router.put("/update/:reviewId", updateReview);
router.delete("/delete/:reviewId", deleteReview);

export default router;
