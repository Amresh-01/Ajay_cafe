import express, { application } from "express";
import dotenv from "dotenv";
import connectDB from "./src/db/db.connect.js";
import cors from "cors";
import userRoutes from "./src/routes/userRoutes.js";
import foodRoutes from "./src/routes/foodRoutes.js";
import orderRoutes from "./src/routes/orderRoutes.js";
import reviewRoutes from "./src/routes/reviewRoutes.js";
import cartRoutes from "./src/routes/cartRoutes.js";
import passport from "./src/config/passport.js";
import session from "express-session";

dotenv.config();

const app = express();
const PORT = 8080;

app.use(cors({ origin: "https://canteeno.netlify.app/", credentials: true }));

app.use(express.json());
app.use(
  session({
    secret: "someSecretKey",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.send("Ajay cafe backend is running");
});

app.use("/google-success", (req, res) => {
  res.send("Google Login Succesfully.");
});

app.use("/api/user", userRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/review", reviewRoutes);

const startServer = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(PORT, () => {
      console.log(`Server is running on Port http://localhost:${PORT}`);
    });
  } catch (error) {
    console.log("Server is not running...", error.message);
    process.exit(1);
  }
};

startServer();
