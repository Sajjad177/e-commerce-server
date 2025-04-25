// import { model, Schema } from "mongoose";
// import { TCart } from "./cart.interface";

// const cartSchema = new Schema<TCart>({
//   userId: {
//     type: Schema.Types.ObjectId,
//     ref: "User",
//   },
//   productId: {
//     type: Schema.Types.ObjectId,
//     ref: "Product",
//   },
//   quantity: {
//     type: Number,
//   },
//   size: {
//     type: String,
//   },
//   price: {
//     type: Number,
//   },
//   name: {
//     type: String,
//   },
//   image: {
//     type: String,
//   },
//   isRemove: {
//     type: Boolean,
//     default: false,
//   },
//   isBuyNow: {
//     type: Boolean,
//     default: false, // when it's come true then we remove the product from cart
//   },
// });

// export const Cart = model<TCart>("Cart", cartSchema);
