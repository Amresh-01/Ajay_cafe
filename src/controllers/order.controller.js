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
  console.log("UserOrders...", orders);

  return res
    .status(200)
    .json(new ApiResponse(200, orders, "User orders fetched successfully"));
});

export const getAnalytics = asyncHandler(async (req, res) => {
  const totalOrders = await Order.countDocuments();

  const revenueData = await Order.aggregate([
    { $group: { _id: null, revenue: { $sum: "$totalAmount" } } },
  ]);
  const totalRevenue = revenueData[0]?.revenue || 0;

  const last7Days = await Order.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 7 },
  ]);

  const ordersPerDay = last7Days.map((d) => ({
    day: d._id,
    count: d.count,
  }));

  const paymentStats = await Order.aggregate([
    { $group: { _id: "$paymentMethod", count: { $sum: 1 } } },
  ]);

  const payments = {
    cash: paymentStats.find((p) => p._id === "cash")?.count || 0,
    card: paymentStats.find((p) => p._id === "card")?.count || 0,
    upi: paymentStats.find((p) => p._id === "upi")?.count || 0,
  };

  const topItemData = await Order.aggregate([
    { $unwind: "$items" },
    { $group: { _id: "$items.food", qty: { $sum: "$items.quantity" } } },
    { $sort: { qty: -1 } },
    { $limit: 1 },
  ]);

  let topItem = null;
  if (topItemData.length > 0) {
    topItem = await Food.findById(topItemData[0]._id).select("name price");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalOrders,
        totalRevenue,
        ordersPerDay,
        payments,
        topItem,
      },
      "Analytics fetched successfully",
    ),
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
