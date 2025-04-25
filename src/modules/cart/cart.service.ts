import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { User } from "../user/user.model";
import { ProductModel } from "../product/product.model";

type CartData = {
  [productId: string]: {
    [size: string]: {
      quantity: number;
      name: string;
      price: number;
      image: string;
    };
  };
};

export const addToCartInDB = async (payload: any, userId: string) => {
  const { productId, quantity = 1, size } = payload;

  if (!size) {
    throw new AppError("Size is required", StatusCodes.BAD_REQUEST);
  }

  // ✅ Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }

  // ✅ Check if product exists
  const product = await ProductModel.findById(productId);
  if (!product) {
    throw new AppError("Product not found", StatusCodes.NOT_FOUND);
  }

  // ✅ Validate size against allowed sizes in the product
  if (!product.size.includes(size)) {
    throw new AppError(
      `Invalid size. Available sizes are: ${product.size.join(", ")}`,
      StatusCodes.BAD_REQUEST
    );
  }

  const cartData: CartData = user.cartData || {};
  const productKey = productId.toString();

  const productInfo = {
    quantity,
    name: product.name,
    price: product.price,
    image: product.images[0],
  };

  // ✅ Add or update product in cartData
  if (cartData[productKey]) {
    if (cartData[productKey][size]) {
      cartData[productKey][size].quantity += quantity;
    } else {
      cartData[productKey][size] = productInfo;
    }
  } else {
    cartData[productKey] = {
      [size]: productInfo,
    };
  }

  // ✅ Save to user
  user.cartData = cartData;
  const result = await user.save();

  return {
    success: true,
    message: "Product added to cart successfully",
    cart: result.cartData,
  };
};

// get those cart isRemove is false and isBuyNow is false
const getAllCartFromDB = async (userId: string) => {};

const updateCartInDB = async () => {};

const removeFromCartInDB = async (userId: string, cartId: string) => {};

export const cartService = {
  addToCartInDB,
  getAllCartFromDB,
  updateCartInDB,
  removeFromCartInDB,
};
