import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import nodemailer from "nodemailer";

dotenv.config();

const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRES,
  REFRESH_TOKEN_EXPIRES,
  MAIL_PASS,
  MAIL_USER,
} = process.env;

function signAccessToken(user) {
  return jwt.sign({ sub: user._id, role: user.role }, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES || "1h",
  });
}

function signRefreshToken(user) {
  return jwt.sign({ sub: user._id, role: user.role }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES || "7d",
  });
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: MAIL_USER, pass: MAIL_PASS },
});

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password || !role) {
    throw new ApiError(400, "Missing required fields");
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  const exists = await User.findOne({ $or: [{ email }, { username }] });
  if (exists) {
    throw new ApiError(409, "User with given email or username already exists");
  }

  const user = new User({
    username,
    email,
    password,
    role,
  });

  await user.save();

  try {
    await user.save();
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
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      "User registered successfully"
    )
  );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(401, "Invalid email");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new ApiError(401, "Invalid password");

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save();

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
          username: user.username,
          email: user.email,
          role: user.role,
        },
        "Login successful"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "User is not authenticated");

  await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  };

  return res
    .status(200)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, null, "Logout successful"));
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { newUsername, newEmail } = req.body;

  if (!userId) throw new ApiError(401, "User not authenticated");
  if (!newUsername && !newEmail)
    throw new ApiError(400, "No data provided for update");

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      ...(newUsername && { username: newUsername }),
      ...(newEmail && { email: newEmail }),
    },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  if (!updatedUser) throw new ApiError(404, "User not found");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Profile updated successfully"));
});

const googleCallback = async (req, res) => {
  try {
    const user = req.user;

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.redirect(
      `https://ajay-cafe-1.onrender.com/google-success?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Google login failed" });
  }
};

export {
  registerUser,
  loginUser,
  logoutUser,
  updateUserProfile,
  googleCallback,
};
