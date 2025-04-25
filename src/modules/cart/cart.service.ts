// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { User } from "../user/user.model";
import { ProductModel } from "../product/product.model";

const addToCartInDB = async (payload: any, userId: string) => {
  const { productId, quantity = 1, size } = payload;

  if (!size) {
    throw new AppError("Size is required", StatusCodes.BAD_REQUEST);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }

  const product = await ProductModel.findById(productId);
  if (!product) {
    throw new AppError("Product not found", StatusCodes.NOT_FOUND);
  }

  // ✅ Validate size
  if (!product.size.includes(size)) {
    throw new AppError(
      `Invalid size. Available sizes are: ${product.size.join(", ")}`,
      StatusCodes.BAD_REQUEST
    );
  }

  const productKey = productId.toString();
  const productInfo = {
    quantity,
    name: product.name,
    price: product.price,
    image: product.images[0],
  };

  // ✅ Ensure cartData is a Map
  if (!(user.cartData instanceof Map)) {
    user.cartData = new Map(Object.entries(user.cartData || {}));
  }

  let productEntry = user.cartData.get(productKey);

  if (!productEntry) {
    productEntry = new Map();
  } else if (!(productEntry instanceof Map)) {
    productEntry = new Map(Object.entries(productEntry));
  }

  // ✅ Update quantity or insert new size
  if (productEntry.has(size)) {
    const existing = productEntry.get(size);
    existing.quantity += quantity;
    productEntry.set(size, existing);
  } else {
    productEntry.set(size, productInfo);
  }

  // ✅ Save back to user
  user.cartData.set(productKey, productEntry);
  const result = await user.save();

  return {
    success: true,
    message: "Product added to cart successfully",
    result,
  };
};

// get those cart isRemove is false and isBuyNow is false
const getUserOwnCartFromDB = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }

  return user.cartData;
};

const removeFromCartInDB = async (
  userId: string,
  productId: string,
  size: string
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }

  console.log("User found:", user);
  console.log("CartData before deletion:", user.cartData);

  let cartData = user.cartData;

  // 🛠 Ensure cartData is a Map
  if (!(cartData instanceof Map)) {
    cartData = new Map(Object.entries(cartData || {}));
  }

  const productEntry = cartData.get(productId);

  // ❌ Product or size not found
  if (!productEntry) {
    throw new AppError("Product not found in cart", StatusCodes.NOT_FOUND);
  }

  // 🛠 Ensure productEntry is also a Map
  const sizeMap =
    productEntry instanceof Map
      ? productEntry
      : new Map(Object.entries(productEntry));

  if (!sizeMap.has(size)) {
    throw new AppError("Size not found in cart", StatusCodes.NOT_FOUND);
  }

  // ✅ Delete specific size
  sizeMap.delete(size);

  // ✅ If sizeMap is empty, delete the product entirely
  if (sizeMap.size === 0) {
    cartData.delete(productId);
  } else {
    cartData.set(productId, sizeMap);
  }

  // ✅ Save the updated cartData
  user.cartData = cartData;
  user.markModified("cartData");

  const result = await user.save();

  return {
    success: true,
    message: "Item removed from cart",
    result: result.cartData,
  };
};

const updateCartQuantity = async (payload: any, userId: string) => {
  const { productId, quantity = 1, size } = payload;

  if (!productId || !size) {
    throw new AppError(
      "Product ID and size are required",
      StatusCodes.BAD_REQUEST
    );
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }

  const product = await ProductModel.findById(productId);
  if (!product) {
    throw new AppError("Product not found", StatusCodes.NOT_FOUND);
  }

  // ✅ Convert Map to plain object (cartData and nested levels)
  let cartData: Record<string, Record<string, any>> = {};
  if (user.cartData instanceof Map) {
    cartData = Object.fromEntries(
      [...user.cartData.entries()].map(([productId, sizeMap]) => [
        productId,
        sizeMap instanceof Map ? Object.fromEntries(sizeMap) : sizeMap,
      ])
    );
  } else {
    cartData = JSON.parse(JSON.stringify(user.cartData || {}));
  }

  // ✅ Validate existence
  if (!cartData[productId] || !cartData[productId][size]) {
    throw new AppError("Item not found in cart", StatusCodes.NOT_FOUND);
  }

  // ✅ Validate stock
  if (quantity > product.stock) {
    throw new AppError(
      `Only ${product.stock} items in stock`,
      StatusCodes.BAD_REQUEST
    );
  }

  // ✅ Update quantity
  cartData[productId][size].quantity = quantity;

  // ✅ Save back to user
  user.cartData = cartData;
  user.markModified("cartData");
  const result = await user.save();

  return {
    success: true,
    message: "Cart item quantity updated successfully",
    result,
  };
};


export const cartService = {
  addToCartInDB,
  getUserOwnCartFromDB,
  updateCartQuantity,
  removeFromCartInDB,
};
