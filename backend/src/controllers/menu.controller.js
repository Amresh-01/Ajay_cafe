import Food from "../models/food.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

const createMenuItem = asyncHandler(async (req, res) => {
  const { name, description, price, category, image, isAvailable } = req.body;

  if (!name || !price) {
    throw new ApiError(400, "Food name and price are required");
  }

  const newMenuItem = await Food.create({
    name,
    description,
    price,
    category,
    image,
    isAvailable,
  });

  res
    .status(201)
    .json(new ApiResponse(201, newMenuItem, "Menu item created successfully"));
});

const getAllMenuItems = asyncHandler(async (req, res) => {
  const menuItems = await Food.find().sort({ createdAt: -1 });
  res
    .status(200)
    .json(
      new ApiResponse(200, menuItems, "All menu items fetched successfully")
    );
});

const getMenuItemById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const menuItem = await Food.findById(id);

  if (!menuItem) throw new ApiError(404, "Menu item not found");

  res
    .status(200)
    .json(new ApiResponse(200, menuItem, "Menu item fetched successfully"));
});

const updateMenuItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const updatedItem = await Food.findByIdAndUpdate(id, updates, { new: true });

  if (!updatedItem) throw new ApiError(404, "Menu item not found");

  res
    .status(200)
    .json(new ApiResponse(200, updatedItem, "Menu item updated successfully"));
});

const deleteMenuItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deletedItem = await Food.findByIdAndDelete(id);

  if (!deletedItem) throw new ApiError(404, "Menu item not found");

  res
    .status(200)
    .json(new ApiResponse(200, null, "Menu item deleted successfully"));
});

export {
  createMenuItem,
  getAllMenuItems,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
};
