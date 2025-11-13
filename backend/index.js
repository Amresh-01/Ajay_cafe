import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import passport from "./src/config/passport.js";
import connectDB from "./src/db/db.connect.js";

// import {
//   securityHeaders,
//   apiLimiter,
//   detectBot,
// } from "./src/middlewares/security.js";
// import { sanitizeRequest } from "./src/middlewares/sanitizeRequests.js";
import { errorHandler } from "./src/middlewares/errorHandler.js";

// Routes
import userRoutes from "./src/routes/userRoutes.js";
import foodRoutes from "./src/routes/foodRoutes.js";
import orderRoutes from "./src/routes/orderRoutes.js";
import reviewRoutes from "./src/routes/reviewRoutes.js";
import cartRoutes from "./src/routes/cartRoutes.js";
import menuRoutes from "./src/routes/menuRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import verificationRoutes from "./src/routes/verificationRoutes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;
const { link1, link2 } = process.env;

// 🧠 Core security stack
// app.use(securityHeaders);
// app.use(hpp());
app.use(
  cors({
    origin: ["http://localhost:5173", link1, link2],
    credentials: true,
  })
);
app.use(express.json());
// app.use(detectBot);
// app.use("/api", apiLimiter);
// app.use(sanitizeRequest);
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // set to true when using HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => res.send("Ajay Café backend is running "));
app.use("/api/verify", verificationRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/review", reviewRoutes);

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(PORT, () =>
      console.log(`Server running on http://localhost:${PORT}`)
    );
  } catch (error) {
    console.error("Server failed to start:", error.message);
    process.exit(1);
  }
};

startServer();
