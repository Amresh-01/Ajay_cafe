import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [
      {
        food: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Food",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
          default: 1,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "delivered", "cancelled"],
      default: "pending",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi"],
      default: "cash",
    },

    deliveryAddress: {
      type: String,
    },

    specialInstructions: {
      type: String,
      trim: true,
    },

    isCancelled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

orderSchema.pre("save", function (next) {
  this.totalAmount = this.items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  next();
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
