// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { User } from "../user/user.model";
import { ProductModel } from "../product/product.model";
import mongoose from "mongoose";

// const addToCartInDB = async (payload: any, userId: string) => {
//   const { productId, quantity = 1, size } = payload;

//   if (!size) {
//     throw new AppError("Size is required", StatusCodes.BAD_REQUEST);
//   }

//   const user = await User.findById(userId);
//   if (!user) {
//     throw new AppError("User not found", StatusCodes.NOT_FOUND);
//   }

//   const product = await ProductModel.findById(productId);
//   if (!product) {
//     throw new AppError("Product not found", StatusCodes.NOT_FOUND);
//   }

//   // ✅ Validate size
//   if (!product.size.includes(size)) {
//     throw new AppError(
//       `Invalid size. Available sizes are: ${product.size.join(", ")}`,
//       StatusCodes.BAD_REQUEST
//     );
//   }

//   const productKey = productId.toString();
//   const productInfo = {
//     quantity,
//     name: product.name,
//     price: product.price,
//     image: product.images[0],
//   };

//   // ✅ Ensure cartData is a Map
//   if (!(user.cartData instanceof Map)) {
//     user.cartData = new Map(Object.entries(user.cartData || {}));
//   }

//   let productEntry = user.cartData.get(productKey);

//   if (!productEntry) {
//     productEntry = new Map();
//   } else if (!(productEntry instanceof Map)) {
//     productEntry = new Map(Object.entries(productEntry));
//   }

//   // ✅ Update quantity or insert new size
//   if (productEntry.has(size)) {
//     const existing = productEntry.get(size);
//     existing.quantity += quantity;
//     productEntry.set(size, existing);
//   } else {
//     productEntry.set(size, productInfo);
//   }

//   // ✅ Save back to user
//   user.cartData.set(productKey, productEntry);
//   const result = await user.save();

//   return {
//     success: true,
//     message: "Product added to cart successfully",
//     result,
//   };
// };

// get those cart isRemove is false and isBuyNow is false

const addToCartInDB = async (
  payload: { productId: string; quantity: number; size: string },
  userId: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Validate user exists
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }

    // 2. Validate product exists and is in stock
    const product = await ProductModel.findById(payload.productId).session(
      session
    );
    if (!product) {
      throw new AppError("Product not found", StatusCodes.NOT_FOUND);
    }

    if (product.size.indexOf(payload.size) === -1) {
      throw new AppError(
        `Invalid size. Available sizes are: ${product.size.join(", ")}`,
        StatusCodes.BAD_REQUEST
      );
    }

    if (product.stock < payload.quantity && !product.isStock) {
      throw new AppError("Product out of stock", StatusCodes.BAD_REQUEST);
    }

    // 3. Create unique key for cart item (productId + size)
    const cartItemKey = `${payload.productId}_${payload.size}`;

    // 4. Update cart using proper Map syntax
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          [`cartData.${cartItemKey}`]: {
            size: payload.size,
            quantity: payload.quantity,
            name: product.name,
            price: product.price,
            image: product.images[0],
            productId: payload.productId,
          },
        },
      },
      { new: true, session }
    );

    await session.commitTransaction();
    return updatedUser;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Verify user exists
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }

    // 2. Generate the same key used when adding to cart
    const cartItemKey = `${productId}_${size}`;

    // 3. Remove the specific cart item using $unset
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $unset: {
          [`cartData.${cartItemKey}`]: 1, // 1 is just a placeholder
        },
      },
      { new: true, session }
    );

    await session.commitTransaction();
    return updatedUser;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

const updateCartQuantity = async (
  payload: { productId: string; quantity: number; size: string },
  userId: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Validate user exists
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }

    // 2. Validate product exists and check stock
    const product = await ProductModel.findById(payload.productId).session(
      session
    );
    if (!product) {
      throw new AppError("Product not found", StatusCodes.NOT_FOUND);
    }

    if (payload.quantity > product.stock) {
      throw new AppError(
        `Only ${product.stock} items available in stock`,
        StatusCodes.BAD_REQUEST
      );
    }

    if (!product.isStock && payload.quantity > product.stock) {
      throw new AppError("Product is out of stock", StatusCodes.BAD_REQUEST);
    }

    // 3. Generate cart item key (same format as addToCart)
    const cartItemKey = `${payload.productId}_${payload.size}`;

    // 4. Verify item exists in cart
    if (!user.cartData.get(cartItemKey)) {
      throw new AppError("Item not found in cart", StatusCodes.NOT_FOUND);
    }

    // 5. Update quantity
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          [`cartData.${cartItemKey}.quantity`]: payload.quantity,
        },
      },
      { new: true, session }
    ).populate("cartData.productId");

    await session.commitTransaction();
    return updatedUser;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

export const cartService = {
  addToCartInDB,
  getUserOwnCartFromDB,
  updateCartQuantity,
  removeFromCartInDB,
};
