import mongoose from "mongoose";

const userModel = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    message: "Name is required",
  },
  email: {
    type: String,
    required: true,
    unique: true,
    message: "Email is required",
  },
  password: {
    type: String,
    required: true,
    message: "Password is required",
  },
  cartData: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Product",
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});
