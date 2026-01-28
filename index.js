import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import passport from "./src/config/passport.js";
import connectDB from "./src/db/db.connect.js";
import http from "http";
import { Server } from "socket.io";

import { errorHandler } from "./src/middlewares/errorHandler.js";

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
const server = http.createServer(app);

// SOCKET.IO CONFIG
export const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", process.env.link1, process.env.link2],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.use(
  cors({
    origin: ["http://localhost:5173", process.env.link1, process.env.link2],
    credentials: true,
  }),
);

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => res.send("Ajay Café backend is running"));
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

const PORT = process.env.PORT || 8080;

const startServer = async () => {
  try {
    await connectDB(process.env.MONGO_URI);

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log("Socket.IO active...");
    });
  } catch (error) {
    console.error("Server failed to start:", error.message);
    process.exit(1);
  }
};

startServer();
