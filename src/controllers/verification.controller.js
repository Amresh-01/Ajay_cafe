import asyncHandler from "../utils/asyncHandler.js";
import { redisClient } from "../middlewares/otp.middleware.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import bcrypt from "bcrypt";
import { sendEmail } from "../utils/sendMail.js";
import User from "../models/user.model.js";

export const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const verifyOtp = async (email, otp) => {
  console.log("I have been hitted verify");

  const hashedOtp = await redisClient.get(`otp:user:${email}`);
  if (!hashedOtp) return false;

  const isOtpCorrect = await bcrypt.compare(otp, hashedOtp);
  return isOtpCorrect;
};

const sendUserOTP = asyncHandler(async (req, res) => {
  const OTP_EXPIRY = 5 * 60; // 5 minutes
  const RATE_LIMIT = 100; // per hour
  const RESEND_LIMIT = 60; // 1 minute

  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  const now = Date.now();

  const lastSent = await redisClient.get(`otp:lastSent:${email}`);
  if (lastSent && now - parseInt(lastSent) < RESEND_LIMIT * 1000) {
    throw new ApiError(429, "Please wait before requesting another OTP.");
  }

  const sentCount = await redisClient.get(`otp:count:${email}`);
  if (sentCount && parseInt(sentCount) >= RATE_LIMIT) {
    throw new ApiError(429, "OTP request limit exceeded. Try again later.");
  }

  const otp = generateOTP();
  const hashedOtp = await bcrypt.hash(otp, 10);

  await redisClient.set(`otp:user:${email}`, hashedOtp, { EX: OTP_EXPIRY });
  await redisClient.set(`otp:lastSent:${email}`, now.toString(), {
    EX: RESEND_LIMIT,
  });

  await redisClient.incr(`otp:count:${email}`);
  await redisClient.expire(`otp:count:${email}`, 3600); // 1 hour window

  await sendEmail(email, "Your Ajay_Cafe OTP Code", `Your OTP is: ${otp}`);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "OTP sent successfully to user"));
});

const verifyUserOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) throw new ApiError(400, "Email and OTP are required");

  const isCorrect = await verifyOtp(email, otp);
  if (!isCorrect) throw new ApiError(400, "Invalid or expired OTP");

  await User.updateOne({ email }, { isVerified: true });
  await redisClient.del(`otp:user:${email}`);

  return res
    .status(200)
    .json(
      new ApiResponse(200, { verified: true }, "User OTP verified successfully")
    );
});

const checkOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new ApiError(400, "Please provide a valid email");
  }
  if (!otp) throw new ApiError(400, "Please provide the email and OTP");

  const isCorrect = await verifyOtp(email, otp);

  return res
    .status(200)
    .json(new ApiResponse(200, { isCorrect }, "OTP checked successfully"));
});

export { sendUserOTP, verifyUserOTP, checkOtp };
