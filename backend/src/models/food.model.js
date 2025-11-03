import mongoose from "mongoose";

const foodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      max: 5,
      min: 0,
      default: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

ffoodSchema.methods.updateRating = function (newRating) {
  this.averageRating =
    (this.averageRating * this.reviewCount + newRating) /
    (this.reviewCount + 1);
  this.reviewCount += 1;
  return this.save();
};

const Food = mongoose.model("Food", foodSchema);
export default Food;
