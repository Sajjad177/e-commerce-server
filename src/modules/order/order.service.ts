import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { User } from "../user/user.model";
import { TOrder } from "./order.interface";
import { ProductModel } from "../product/product.model";
import { Order } from "./order.model";
import { Types } from "mongoose";
import { TProduct } from "../product/product.interface";

const placeOrderIntoDBWithCOD = async (
  payload: {
    products: { productId: string; quantity: number }[];
    address: string;
  },
  userId: string
) => {
  // 1. Check if user exists
  const isUserExist = await User.findById(userId);
  if (!isUserExist) {
    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }

  const products = payload.products;

  // 2. Fetch all product details from DB
  const productDetails = await Promise.all(
    products.map(async (item) => {
      const product = await ProductModel.findById(item.productId);
      if (!product) {
        throw new AppError(
          `Product with ID ${item.productId} not found`,
          StatusCodes.NOT_FOUND
        );
      }

      return {
        ...product.toObject(),
        orderedQuantity: item.quantity,
      };
    })
  );

  // 3. Validate stock availability
  for (const item of productDetails) {
    if (!item.inStock) {
      throw new AppError(`Product is out of stock`, StatusCodes.BAD_REQUEST);
    }

    if (item.stock < item.orderedQuantity) {
      throw new AppError(
        `Product has only ${item.stock} in stock`,
        StatusCodes.BAD_REQUEST
      );
    }
  }

  // 4. Update stock & mark inStock = false if needed
  await Promise.all(
    productDetails.map(async (item) => {
      const newStock = item.stock - item.orderedQuantity;

      await ProductModel.findByIdAndUpdate(item._id, {
        $set: {
          stock: newStock,
          inStock: newStock > 0,
        },
      });

      if (newStock < 0) {
        throw new AppError(
          `Unexpected error: stock for ${item.name} dropped below 0`,
          StatusCodes.INTERNAL_SERVER_ERROR
        );
      }
    })
  );

  // 5. Calculate total amount
  const totalAmount = productDetails.reduce(
    (acc, item) => acc + item.price * item.orderedQuantity,
    0
  );

  // const totalQuantity = productDetails.reduce(
  //   (acc, item) => acc + item.orderedQuantity,
  //   0
  // );

  // 6. Prepare products array for order
  const orderProducts = products.map((item) => ({
    productId: new Types.ObjectId(item.productId),
    quantity: item.quantity,
  }));

  const newOrder = await Order.create({
    userId,
    products: orderProducts,
    amount: totalAmount,
    address: payload.address,
    paymentMethod: "cod",
    payment: false,
    paymentStatus: "pending",
  });

  // 8. Optionally, add order to user's cart/history
  await User.findByIdAndUpdate(
    userId,
    {
      $push: { cartData: newOrder._id },
    },
    { new: true }
  );

  return newOrder;
};

const placeOrderIntoDBWithStripe = async (order: any) => {};

const placeOrderIntoDBWithShurjopay = async (order: any) => {};

const getAllOrdersFromDB = async () => {};

const getUserOwnOrdersFromDB = async (userId: string) => {};

const updateOrderStatusFromDB = async (orderId: string, status: string) => {};

export const orderService = {
  placeOrderIntoDBWithCOD,
  placeOrderIntoDBWithStripe,
  placeOrderIntoDBWithShurjopay,
  getAllOrdersFromDB,
  getUserOwnOrdersFromDB,
  updateOrderStatusFromDB,
};
