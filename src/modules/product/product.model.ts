import { model, Schema } from "mongoose";
import { TProduct } from "./product.interface";

const productModel = new Schema<TProduct>(
  {
    name: {
      type: String,
      required: true,
      message: "Name is required",
    },
    description: {
      type: String,
      required: true,
      message: "Description is required",
    },
    price: {
      type: Number,
      required: true,
      message: "Price is required",
      min: 0,
    },
    category: {
      type: String,
      enum: ["Men", "Women", "Kids"],
      required: true,
      message: "Category is required",
    },
    subCategory: {
      type: String,
      enum: ["Topwear", "Bottomwear", "Winterwear"],
      required: true,
      message: "Subcategory is required",
    },
    stock: {
      type: Number,
      required: true,
      message: "Stock is required",
      min: 0,
    },
    images: {
      type: [String],
      required: true,
      message: "Images are required",
    },
    size: {
      type: [String],
      enum: ["S", "M", "L", "XL", "XXL"],
      required: true,
      message: "Size is required",
    },
    bestSeller: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const ProductModel = model<TProduct>(
  "Product",
  productModel,
  "products"
);
