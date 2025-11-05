import asyncHandler from "express-async-handler";
import Review from "../models/review.model.js";
import Food from "../models/food.model.js";
import asyncHandler from "./asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const createReview = asyncHandler(async (req, res) => {
  const { foodId, rating, comment } = req.body;
  const userId = req.user._id;

  const food = await Food.findById(foodId);
  if (!food) throw new ApiError(404, "Food not found");

  const existingReview = await Review.findOne({ user: userId, food: foodId });
  if (existingReview)
    throw new ApiError(400, "You have already reviewed this food");

  const review = await Review.create({
    user: userId,
    food: foodId,
    rating,
    comment,
  });

  res
    .status(201)
    .json(new ApiResponse(201, review, "Review created successfully"));
});

const getReviewsByFood = asyncHandler(async (req, res) => {
  const { foodId } = req.params;
  const reviews = await Review.find({ food: foodId }).populate(
    "user",
    "name email"
  );

  res
    .status(200)
    .json(new ApiResponse(200, reviews, `${reviews.length} review(s) found`));
});

const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user._id;

  const review = await Review.findById(id);
  if (!review) throw new ApiError(404, "Review not found");

  if (review.user.toString() !== userId.toString()) {
    throw new ApiError(403, "You can only update your own reviews");
  }

  review.rating = rating || review.rating;
  review.comment = comment || review.comment;
  await review.save();

  res
    .status(200)
    .json(new ApiResponse(200, review, "Review updated successfully"));
});

const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const review = await Review.findById(id);
  if (!review) throw new ApiError(404, "Review not found");

  if (review.user.toString() !== userId.toString()) {
    throw new ApiError(403, "You can only delete your own reviews");
  }

  await review.remove();

  res
    .status(200)
    .json(new ApiResponse(200, null, "Review deleted successfully"));
});

export { createReview, getReviewsByFood, updateReview, deleteReview };
