import { model, Schema } from "mongoose";
import { TOrder } from "./order.interface";

const orderSchema = new Schema<TOrder>({
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
    enum: ["cod", "online"],
    default: "cod",
  },
  payment: {
    type: Boolean,
    default: false,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "success", "failed"],
    default: "pending",
  },
});

export const Order = model<TOrder>("Order", orderSchema);
