import Review from "../models/review.model.js";
import Food from "../models/food.model.js";

const createReview = async (req, res) => {
  try {
    const { foodId, rating, comment } = req.body;
    const userId = req.user._id;

    const food = await Food.findById(foodId);
    if (!food) {
      return res.status(404).json({ message: "Food not found" });
    }

    const existingReview = await Review.findOne({ user: userId, food: foodId });
    if (existingReview) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this food" });
    }

    const review = await Review.create({
      user: userId,
      food: foodId,
      rating,
      comment,
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getReviewsByFood = async (req, res) => {
  try {
    const { foodId } = req.params;
    const reviews = await Review.find({ food: foodId }).populate(
      "user",
      "name email"
    );
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.user.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You can only update your own reviews" });
    }

    review.rating = rating || review.rating;
    review.comment = comment || review.comment;

    await review.save();
    res.status(200).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Only allow the user who wrote the review to delete it
    if (review.user.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You can only delete your own reviews" });
    }

    await review.remove();
    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { createReview, getReviewsByFood, updateReview, deleteReview };
