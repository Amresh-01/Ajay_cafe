import Food from "../models/food.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import cloudinary from "../utils/cloudinary.js";
import fs from "fs";

const createFood = asyncHandler(async (req, res) => {
  const { name, description, price, category } = req.body;

  if (!name || !price || !category) {
    throw new ApiError(400, "Name, price, and category are required");
  }

  let imageUrl = null;

  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "ajay_cafe_foods",
      resource_type: "image",
    });
    imageUrl = result.secure_url;

    fs.unlinkSync(req.file.path);
  }

  const food = await Food.create({
    name,
    description,
    price,
    image: imageUrl,
    category,
  });

  res
    .status(201)
    .json(new ApiResponse(201, food, "Food item created successfully"));
});

const getAllFoods = asyncHandler(async (req, res) => {
  const { category, available } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (available) filter.isAvailable = available === "true";

  const foods = await Food.find(filter);

  res
    .status(200)
    .json(new ApiResponse(200, foods, "Foods fetched successfully"));
});

const getFoodById = asyncHandler(async (req, res) => {
  const food = await Food.findById(req.params.foodId);

  if (!food) throw new ApiError(404, "Food not found");

  res.status(200).json(new ApiResponse(200, food, "Food fetched successfully"));
});

const updateFood = asyncHandler(async (req, res) => {
  const { name, description, price, category, isAvailable } = req.body;
  const updateData = { name, description, price, category, isAvailable };

  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "ajay_cafe_foods",
      resource_type: "image",
    });
    updateData.image = result.secure_url;
    fs.unlinkSync(req.file.path);
  }

  const updatedFood = await Food.findByIdAndUpdate(
    req.params.foodId,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedFood) {
    throw new ApiError(404, "Food not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, updatedFood, "Food updated successfully"));
});

const deleteFood = asyncHandler(async (req, res) => {
  const food = await Food.findById(req.params.foodId);

  if (!food) throw new ApiError(404, "Food not found");

  if (food.image) {
    try {
      const publicId = food.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`ajay_cafe_foods/${publicId}`);
    } catch (err) {
      console.warn("Failed to delete image from Cloudinary:", err.message);
    }
  }

  await food.deleteOne();

  res.status(200).json(new ApiResponse(200, {}, "Food deleted successfully"));
});

const rateFood = asyncHandler(async (req, res) => {
  const { rating } = req.body;

  if (rating === undefined || rating < 0 || rating > 5) {
    throw new ApiError(400, "Rating must be between 0 and 5");
  }

  const food = await Food.findById(req.params.foodId);
  if (!food) throw new ApiError(404, "Food not found");

  const updatedFood = await food.updateRating(rating);

  res
    .status(200)
    .json(
      new ApiResponse(200, updatedFood, "Food rating updated successfully")
    );
});

export {
  createFood,
  getAllFoods,
  getFoodById,
  updateFood,
  deleteFood,
  rateFood,
};
