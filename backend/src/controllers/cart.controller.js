import Cart from "../models/food.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import Food from "../models/food.model.js";

const addToCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { foodId, quantity } = req.body;

  if (!foodId) throw new ApiError(400, "Food ID is required");
  if (quantity <= 0) throw new ApiError(400, "Quantity must be at least 1");

  const food = await Food.findById(foodId);
  if (!food) throw new ApiError(404, "Food not found");

  let cart = await cart.findOne({ UserId });

  if (!cart) {
    cart = new Cart({
      userId,
      items: [{ foodId, quantity, price: food.price }],
    });
  } else {
    const existingItem = cart.items.find(
      (item) => item.foodId.toString() === foodId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ foodId, quantity, price: food.price });
    }
  }

  await cart.save();

  res
    .status(200)
    .json(new ApiResponse(200, cart, "Item added to cart successfully"));
});

const getMyCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const cart = await Cart.findOne({ userId }).populate(
    "items.foodId",
    "name price image"
  );

  if (!cart) throw new ApiError(404, "Cart not found");

  res.status(200).json(new ApiResponse(200, cart, "Cart fetched Successfully"));
});

export { addToCart, getMyCart };
