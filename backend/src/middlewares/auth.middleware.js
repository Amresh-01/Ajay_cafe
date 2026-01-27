import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/user.model.js";
import Admin from "../models/admin.model.js";

dotenv.config();


export const protect = async (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    let user = null;

    
    if (decoded.role === "admin") {
      user = await Admin.findById(decoded.sub).select("-password");
    } else {
      user = await User.findById(decoded.sub).select("-password");
    }

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User or Admin not found." });
    }

    
    req.user = {
      _id: user._id,
      role: user.role,
      username: user.username || user.name, 
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again.",
      });
    }

    return res.status(401).json({ success: false, message: "Invalid token." });
  }
};

export const admin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Access denied. Admin only." });
  }
  next();
};
