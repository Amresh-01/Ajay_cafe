import express, { application } from "express";
import dotenv from "dotenv";
import connectDB from "./src/db/db.connect.js";
import cors from "cors";
import authRoutes from "./src/routes/authRoutes.js";
import jobsRoutes from "./src/routes/jobsRoutes.js";
import applicationsRoutes from "./src/routes/appliactionsRoutes.js";
import passport from "./src/config/passport.js";
import session from "express-session";

dotenv.config();

const app = express();
const PORT = 8080;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));

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

app.use("/api/user", authRoutes);

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
