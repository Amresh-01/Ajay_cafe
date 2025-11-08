import Admin from "../models/admin.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const registerAdmin = asyncHandler(async (req, res) => {
  const { name, userId, password, role } = req.body;

  const existing = await Admin.findOne({ userId });
  if (existing) {
    throw new ApiError(409, "Admin already exists");
  }

  const admin = await Admin.create({ name, userId, password, role });

  const token = jwt.sign({ id: admin._id }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "7d",
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, { token, admin }, "Admin registered successfully")
    );
});

export const loginAdmin = asyncHandler(async (req, res) => {
  const { userId, password } = req.body;

  const admin = await Admin.findOne({ userId });
  if (!admin) {
    throw new ApiError(401, "Invalid admin ID");
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    throw new ApiError(401, "Incorrect password");
  }

  const token = jwt.sign({ id: admin._id }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "7d",
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { token, admin }, "Admin logged in successfully")
    );
});
