import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },
    googleId: {
      type: String,
    },
    role: {
      type: String,
      enum: ["owner", "customer"],
      required: true,
      lowercase: true,
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const plainPassword = this.password;

  if (!this.googleId) {
    const strongPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPassword.test(plainPassword)) {
      return next(
        new Error(
          "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character"
        )
      );
    }
  }

  this.password = await bcrypt.hash(plainPassword, 10);
  next();
});

const User = mongoose.model("User", userSchema);
export default User;
