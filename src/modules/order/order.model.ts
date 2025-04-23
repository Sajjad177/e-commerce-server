import { model, Schema } from "mongoose";
import { TOrder } from "./order.interface";

const orderSchema = new Schema<TOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: {
      type: [Schema.Types.ObjectId],
      ref: "Product",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "Order Placed",
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "stripe", "shurjopay"],
      default: "cod",
    },
    payment: {
      type: Boolean, // when user pay in strip or shurjopay then make it true
      default: false,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export const Order = model<TOrder>("Order", orderSchema);


