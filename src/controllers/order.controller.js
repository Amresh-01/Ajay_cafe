import Order from "../models/order.model.js";
import Food from "../models/food.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { io } from "../../index.js";

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
        price: food.price,
        quantity: item.quantity,
      };
    }),
  );

  const totalAmount = orderItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    tableNumber,
    paymentMethod: paymentMethod || "cash",
    totalAmount,
  });

  io.emit("kids-new-order", order);

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
  const { status, riderLocation } = req.body;
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  order.status = status || order.status;
  await order.save();

  io.emit("kds-status-updated", order);
  io.emit(`order-${order._id}-status`, { status: order.status });

  if (riderLocation) {
    io.emit(`order-${order._id}-location`, {
      lat: riderLocation.lat,
      lng: riderLocation.lng,
    });
  }
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

const getUserOrders = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const orders = await Order.find({ user: userId })
    .populate("items.food", "name image price")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, orders, "User orders fetched successfully"));
});

export const getAnalytics = asyncHandler(async (req, res) => {
  const today = new Date();

  const weekAgo = new Date();
  weekAgo.setDate(today.getDate() - 7);

  const weekly = await Order.aggregate([
    { $match: { createdAt: { $gte: weekAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$totalAmount" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const hourly = await Order.aggregate([
    {
      $group: {
        _id: { hour: { $hour: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.hour": 1 } },
  ]);

  const categorySales = await Order.aggregate([
    { $unwind: "$items" },
    {
      $lookup: {
        from: "foods",
        localField: "items.food",
        foreignField: "_id",
        as: "foodDetails",
      },
    },
    { $unwind: "$foodDetails" },
    {
      $group: {
        _id: "$foodDetails.category",
        count: { $sum: "$items.quantity" },
      },
    },
  ]);

  const topItems = await Order.aggregate([
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.food",
        totalSold: { $sum: "$items.quantity" },
      },
    },
    {
      $lookup: {
        from: "foods",
        localField: "_id",
        foreignField: "_id",
        as: "foodDetails",
      },
    },
    { $unwind: "$foodDetails" },
    { $sort: { totalSold: -1 } },
    { $limit: 5 },
  ]);

  const customerStats = await Order.aggregate([
    {
      $group: {
        _id: "$user",
        orders: { $sum: 1 },
      },
    },
  ]);

  const newCustomers = customerStats.filter((c) => c.orders === 1).length;
  const returningCustomers = customerStats.filter((c) => c.orders > 1).length;

  const funnel = await Order.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  res.json(
    new ApiResponse(200, {
      weekly,
      hourly,
      categorySales,
      topItems,
      newCustomers,
      returningCustomers,
      funnel,
    }),
  );
});

export {
  deleteOrder,
  updateOrderStatus,
  getOrderById,
  getAllOrders,
  createOrder,
  getUserOrders,
};
