import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  updateUserProfile,
  googleCallback,
} from "../controllers/user.controller.js";
import passport from "../config/passport.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.post("/logout", protect, logoutUser);
router.put("/updateDetails", protect, updateUserProfile);
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  googleCallback
);

export default router;
