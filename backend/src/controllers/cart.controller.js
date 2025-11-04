import Cart from "../models/cart.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import Food from "../models/food.model.js";

const addToCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { foodId, quantity } = req.body;

  if (!foodId) throw new ApiError(400, "Food ID is required");
  if (!quantity || quantity <= 0)
    throw new ApiError(400, "Quantity must be at least 1");

  const food = await Food.findById(foodId);

  if (!food) throw new ApiError(404, "Food not found");

  let cart = await Cart.findOne({ userId });

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

  res.status(200).json(new ApiResponse(200, cart, "Cart fetched successfully"));
});

const updateCartItem = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { foodId, quantity } = req.body;

  if (!foodId) throw new ApiError(400, "Food ID is required");
  if (quantity < 0) throw new ApiError(400, "Quantity cannot be negative");

  const cart = await Cart.findOne({ userId });
  if (!cart) throw new ApiError(404, "Cart not found");

  const item = cart.items.find((item) => item.foodId.toString() === foodId);
  if (!item) throw new ApiError(404, "Item not found in cart");

  if (quantity === 0) {
    cart.items = cart.items.filter((i) => i.foodId.toString() !== foodId);
  } else {
    item.quantity = quantity;
  }

  await cart.save();

  res
    .status(200)
    .json(new ApiResponse(200, cart, "Cart item updated successfully"));
});

const removeCartItem = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { foodId } = req.params;

  const cart = await Cart.findOne({ userId });
  if (!cart) throw new ApiError(404, "Cart not found");

  cart.items = cart.items.filter((item) => item.foodId.toString() !== foodId);

  await cart.save();

  res
    .status(200)
    .json(new ApiResponse(200, cart, "Item removed from cart successfully"));
});

const clearCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const cart = await Cart.findOne({ userId });
  if (!cart) throw new ApiError(404, "Cart not found");

  cart.items = [];
  await cart.save();

  res.status(200).json(new ApiResponse(200, cart, "Cart cleared successfully"));
});

const getCartTotal = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const cart = await Cart.findOne({ userId }).populate("items.foodId", "price");
  if (!cart) throw new ApiError(404, "Cart not found");

  const total = cart.items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  res
    .status(200)
    .json(
      new ApiResponse(200, { total }, "Cart total calculated successfully")
    );
});

export {
  addToCart,
  getMyCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  getCartTotal,
};
