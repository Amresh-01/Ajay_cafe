import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import Admin from "../models/admin.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

dotenv.config();

const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRES,
  REFRESH_TOKEN_EXPIRES,
} = process.env;

// 🔹 Helper functions for token generation
function signAccessToken(admin) {
  return jwt.sign({ sub: admin._id, role: admin.role }, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES || "1h",
  });
}

function signRefreshToken(admin) {
  return jwt.sign({ sub: admin._id, role: admin.role }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES || "7d",
  });
}

// 🔹 Register Admin
const registerAdmin = asyncHandler(async (req, res) => {
  const { name, userId, password, role } = req.body;

  if (!name || !userId || !password || !role) {
    throw new ApiError(400, "Missing required fields");
  }

  const existingAdmin = await Admin.findOne({ userId });
  if (existingAdmin) {
    throw new ApiError(409, "Admin with this userId already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = new Admin({
    name,
    userId,
    password,
    role,
  });

  try {
    await admin.save();
  } catch (err) {
    if (err.name === "ValidationError") {
      throw new ApiError(400, Object.values(err.errors)[0].message);
    }
    throw err;
  }

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        id: admin._id,
        name: admin.name,
        userId: admin.userId,
        role: admin.role,
      },
      "Admin registered successfully"
    )
  );
});

// 🔹 Login Admin
const loginAdmin = asyncHandler(async (req, res) => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    throw new ApiError(400, "User ID and password are required");
  }

  const admin = await Admin.findOne({ userId });
  if (!admin) throw new ApiError(401, "Invalid admin credentials");

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) throw new ApiError(401, "Invalid password");

  const accessToken = signAccessToken(admin);
  const refreshToken = signRefreshToken(admin);

  admin.refreshToken = refreshToken;
  await admin.save();

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          accessToken,
          refreshToken,
          name: admin.name,
          userId: admin.userId,
          role: admin.role,
        },
        "Admin login successful"
      )
    );
});

// 🔹 Logout Admin
const logoutAdmin = asyncHandler(async (req, res) => {
  const adminId = req.user?.id;
  if (!adminId) throw new ApiError(401, "Admin not authenticated");

  await Admin.findByIdAndUpdate(adminId, { $unset: { refreshToken: 1 } });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  };

  return res
    .status(200)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, null, "Admin logout successful"));
});

// 🔹 Update Admin Profile
const updateAdminProfile = asyncHandler(async (req, res) => {
  const adminId = req.user?.id;
  const { newName, newUserId } = req.body;

  if (!adminId) throw new ApiError(401, "Admin not authenticated");
  if (!newName && !newUserId)
    throw new ApiError(400, "No data provided for update");

  const updatedAdmin = await Admin.findByIdAndUpdate(
    adminId,
    {
      ...(newName && { name: newName }),
      ...(newUserId && { userId: newUserId }),
    },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  if (!updatedAdmin) throw new ApiError(404, "Admin not found");

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedAdmin, "Admin profile updated successfully")
    );
});

export { registerAdmin, loginAdmin, logoutAdmin, updateAdminProfile };
