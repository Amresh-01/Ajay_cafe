import Razorpay from "razorpay";
import crypto from "crypto";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import Payment from "../models/payment.model.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrder = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const userId = req.user?._id;

  if (!amount || amount <= 0) {
    throw new ApiError(400, "Amount must be greater than 0");
  }

  const options = {
    amount: Math.round(amount * 100),
    currency: "INR",
    receipt: `rcpt_${Date.now()}`,
    payment_capture: 1,
  };

  const razorpayOrder = await razorpay.orders.create(options);

  const payment = await Payment.create({
    user: userId,
    amount: options.amount,
    razorpayOrderId: razorpayOrder.id,
    status: "created",
  });

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { order: razorpayOrder, payment },
        "Razorpay order created"
      )
    );
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(400, "Missing Razorpay payment details");
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      { status: "failed" }
    );
    throw new ApiError(400, "Invalid payment signature");
  }

  const payment = await Payment.findOneAndUpdate(
    { razorpayOrderId: razorpay_order_id },
    {
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: "paid",
    },
    { new: true }
  );

  res
    .status(200)
    .json(new ApiResponse(200, payment, "Payment verified successfully"));
});

export const getAllPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find()
    .populate("user", "username email")
    .sort({ createdAt: -1 });

  res
    .status(200)
    .json(new ApiResponse(200, payments, "All payments fetched successfully"));
});

export const getPaymentById = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  const payment = await Payment.findById(paymentId).populate(
    "user",
    "username email"
  );

  if (!payment) throw new ApiError(404, "Payment not found");

  res
    .status(200)
    .json(new ApiResponse(200, payment, "Payment fetched successfully"));
});
