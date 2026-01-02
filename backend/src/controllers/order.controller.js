import Order from "../models/order.model.js";
import Food from "../models/food.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

const createOrder = asyncHandler(async (req, res) => {
  const { items, tableNumber, paymentMethod } = req.body;

  if (!items || items.length === 0) {
    throw new ApiError(400, "No order items found");
  }

  const orderItems = await Promise.all(
    items.map(async (item) => {
      const food = await Food.findById(item.foodId);
      if (!food) throw new ApiError(404, `Food item not found: ${item.foodId}`);
      return {
        food: food._id,
        name: food.name,
        price: food.price,
        quantity: item.quantity,
      };
    })
  );

  const totalAmount = orderItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    tableNumber,
    paymentMethod,
    totalAmount,
  });

  res
    .status(201)
    .json(new ApiResponse(201, order, "Order placed successfully"));
});

const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate("user", "name email")
    .populate("items.food", "name price");

  res
    .status(200)
    .json(new ApiResponse(200, orders, "All orders fetched successfully"));
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId)
    .populate("user", "name email")
    .populate("items.food", "name price");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, order, "Order fetched successfully"));
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  order.status = status || order.status;
  await order.save();

  res
    .status(200)
    .json(new ApiResponse(200, order, "Order status updated successfully"));
});

const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  await order.deleteOne();

  res.status(200).json(new ApiResponse(200, {}, "Order deleted successfully"));
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).populate(
    "items.food",
    "name price"
  );

  res
    .status(200)
    .json(new ApiResponse(200, orders, "User orders fetched successfully"));
});

export {
  getMyOrders,
  deleteOrder,
  updateOrderStatus,
  getOrderById,
  getAllOrders,
  createOrder,
};
