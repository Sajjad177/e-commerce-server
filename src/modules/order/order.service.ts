// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { User } from "../user/user.model";
import { TOrder } from "./order.interface";
import { ProductModel } from "../product/product.model";
import { Order } from "./order.model";
import { Types } from "mongoose";
import { orderUtils } from "./order.utils";
import { VerificationResponse } from "shurjopay";

const placeOrderIntoDBWithCOD = async (
  payload: {
    address: string;
  },
  userId: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Get user with cart data
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }

    // 2. Check if cart is empty
    const cartData = user.cartData;
    if (!cartData || cartData.size === 0) {
      throw new AppError("Cart is empty", StatusCodes.BAD_REQUEST);
    }

    // 3. Process cart items
    let totalAmount = 0;
    const orderProducts = [];
    const productUpdates = new Map(); // Track stock updates per product

    // Get all unique product IDs from cart
    const productIds = Array.from(
      new Set(
        Array.from(cartData.values()).map((item) => item.productId.toString())
      )
    );

    // Fetch all products at once
    const products = await ProductModel.find({
      _id: { $in: productIds },
    }).session(session);

    // Process each cart item
    for (const [key, cartItem] of cartData.entries()) {
      const product = products.find(
        (p) => p._id.toString() === cartItem.productId.toString()
      );
      if (!product) {
        throw new AppError(
          `Product ${cartItem.productId} not found`,
          StatusCodes.NOT_FOUND
        );
      }

      // Initialize stock tracking for this product if not exists
      if (!productUpdates.has(product._id.toString())) {
        productUpdates.set(product._id.toString(), {
          currentStock: product.stock,
          totalDeduction: 0,
        });
      }

      const productStock = productUpdates.get(product._id.toString());

      // Validate stock for this item
      if (productStock.currentStock < cartItem.quantity) {
        throw new AppError(
          `Insufficient stock for ${product.name} (Size: ${cartItem.size}). Only ${productStock.currentStock} available`,
          StatusCodes.BAD_REQUEST
        );
      }

      // Update tracking
      productStock.currentStock -= cartItem.quantity;
      productStock.totalDeduction += cartItem.quantity;

      // Add to order products
      orderProducts.push({
        productId: product._id,
        quantity: cartItem.quantity,
        size: cartItem.size,
        price: cartItem.price,
        name: cartItem.name,
        image: cartItem.image,
      });

      // Calculate total
      totalAmount += cartItem.quantity * cartItem.price;
    }

    // 4. Prepare bulk write operations for stock updates
    const bulkOperations = Array.from(productUpdates.entries()).map(
      ([productId, stockInfo]) => ({
        updateOne: {
          filter: { _id: productId },
          update: {
            $inc: { stock: -stockInfo.totalDeduction },
            $set: {
              inStock: stockInfo.currentStock - stockInfo.totalDeduction > 0,
            },
          },
        },
      })
    );

    // 5. Create order
    const [order] = await Order.create(
      [
        {
          userId,
          products: orderProducts,
          totalAmount,
          address: payload.address,
          status: "pending",
          paymentMethod: "cod",
          payment: false,
          paymentStatus: "Pending",
        },
      ],
      { session }
    );

    // 6. Update product stocks
    if (bulkOperations.length > 0) {
      await ProductModel.bulkWrite(bulkOperations, { session });
    }

    // 7. Clear user's cart
    await User.findByIdAndUpdate(
      userId,
      { $set: { cartData: new Map() } }, // Reset to empty Map
      { session }
    );

    await session.commitTransaction();
    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

// const placeOrderIntoDBWithShurjopay = async (
//   payload: {
//     products: { productId: string; quantity: number }[];
//     address: string;
//     city: string;
//     postalCode: string;
//     phone: string;
//   },
//   userId: string,
//   client_ip: string
// ) => {
//   // 1. Check if user exists
//   const isUserExist = await User.findById(userId);
//   if (!isUserExist) {
//     throw new AppError("User not found", StatusCodes.NOT_FOUND);
//   }

//   const products = payload.products;

//   // 2. Fetch all product details from DB
//   const productDetails = await Promise.all(
//     products.map(async (item) => {
//       const product = await ProductModel.findById(item.productId);
//       if (!product) {
//         throw new AppError(
//           `Product with ID ${item.productId} not found`,
//           StatusCodes.NOT_FOUND
//         );
//       }

//       return {
//         ...product.toObject(),
//         orderedQuantity: item.quantity,
//       };
//     })
//   );

//   // 3. Validate stock availability
//   for (const item of productDetails) {
//     if (!item.inStock) {
//       throw new AppError(`Product is out of stock`, StatusCodes.BAD_REQUEST);
//     }

//     if (item.stock < item.orderedQuantity) {
//       throw new AppError(
//         `Product has only ${item.stock} in stock`,
//         StatusCodes.BAD_REQUEST
//       );
//     }
//   }

//   // 4. Update stock & mark inStock = false if needed
//   await Promise.all(
//     productDetails.map(async (item) => {
//       const newStock = item.stock - item.orderedQuantity;

//       await ProductModel.findByIdAndUpdate(item._id, {
//         $set: {
//           stock: newStock,
//           inStock: newStock > 0,
//         },
//       });

//       if (newStock < 0) {
//         throw new AppError(
//           `Unexpected error: stock for ${item.name} dropped below 0`,
//           StatusCodes.INTERNAL_SERVER_ERROR
//         );
//       }
//     })
//   );

//   // 5. Calculate total amount
//   const totalAmount = productDetails.reduce(
//     (acc, item) => acc + item.price * item.orderedQuantity,
//     0
//   );

//   // 6. Prepare products array for order
//   const orderProducts = products.map((item) => ({
//     productId: new Types.ObjectId(item.productId),
//     quantity: item.quantity,
//   }));

// const newOrder = await Order.create({
//   userId,
//   products: orderProducts,
//   name: isUserExist.name,
//   email: isUserExist.email,
//   amount: totalAmount,
//   address: payload.address,
//   city: payload.city,
//   postalCode: payload.postalCode,
//   paymentMethod: "shurjopay",
//   payment: false,
//   paymentStatus: "Pending",
//   transaction: {
//     id: "",
//     transactionStatus: "",
//   },
// });

//   // 8. Optionally, add order to user's cart/history
//   await User.findByIdAndUpdate(
//     userId,
//     {
//       $push: { cartData: newOrder._id },
//     },
//     { new: true }
//   );

// payment gateway integration shurjopay
// const shurjopayPayload = {
//   amount: totalAmount,
//   order_id: newOrder._id,
//   currency: "BDT",
//   customer_name: isUserExist.name,
//   customer_email: isUserExist.email,
//   customer_phone: payload.phone,
//   customer_address: payload.address,
//   customer_city: payload.city,
//   customer_post_code: payload.postalCode,
//   client_ip,
// };

// const payment = await orderUtils.makePaymentAsyn(shurjopayPayload);

// // Update transaction details in the order
// if (payment?.transactionStatus) {
//   await Order.updateOne(
//     { _id: newOrder._id },
//     {
//       $set: {
//         "transaction.id": payment.sp_order_id,
//         "transaction.transactionStatus": payment.transactionStatus,
//       },
//     }
//   );
// }

//   return { newOrder, checkout_url: payment?.checkout_url };
// };

const placeOrderIntoDBWithShurjopay = async (
  payload: {
    products: { productId: string; quantity: number }[];
    address: string;
    city: string;
    postalCode: string;
    phone: string;
  },
  userId: string,
  client_ip: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Get user with cart data
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }

    // 2. Check if cart is empty
    const cartData = user.cartData;
    if (!cartData || cartData.size === 0) {
      throw new AppError("Cart is empty", StatusCodes.BAD_REQUEST);
    }

    // 3. Process cart items
    let totalAmount = 0;
    const orderProducts = [];
    const productUpdates = new Map(); // Track stock updates per product

    // Get all unique product IDs from cart
    const productIds = Array.from(
      new Set(
        Array.from(cartData.values()).map((item) => item.productId.toString())
      )
    );

    // Fetch all products at once
    const products = await ProductModel.find({
      _id: { $in: productIds },
    }).session(session);

    // Process each cart item
    for (const [key, cartItem] of cartData.entries()) {
      const product = products.find(
        (p) => p._id.toString() === cartItem.productId.toString()
      );
      if (!product) {
        throw new AppError(
          `Product ${cartItem.productId} not found`,
          StatusCodes.NOT_FOUND
        );
      }

      // Initialize stock tracking for this product if not exists
      if (!productUpdates.has(product._id.toString())) {
        productUpdates.set(product._id.toString(), {
          currentStock: product.stock,
          totalDeduction: 0,
        });
      }

      const productStock = productUpdates.get(product._id.toString());

      // Validate stock for this item
      if (productStock.currentStock < cartItem.quantity) {
        throw new AppError(
          `Insufficient stock for ${product.name} (Size: ${cartItem.size}). Only ${productStock.currentStock} available`,
          StatusCodes.BAD_REQUEST
        );
      }

      // Update tracking
      productStock.currentStock -= cartItem.quantity;
      productStock.totalDeduction += cartItem.quantity;

      // Add to order products
      orderProducts.push({
        productId: product._id,
        quantity: cartItem.quantity,
        size: cartItem.size,
        price: cartItem.price,
        name: cartItem.name,
        image: cartItem.image,
      });

      // Calculate total
      totalAmount += cartItem.quantity * cartItem.price;
    }

    // 4. Prepare bulk write operations for stock updates
    const bulkOperations = Array.from(productUpdates.entries()).map(
      ([productId, stockInfo]) => ({
        updateOne: {
          filter: { _id: productId },
          update: {
            $inc: { stock: -stockInfo.totalDeduction },
            $set: {
              inStock: stockInfo.currentStock - stockInfo.totalDeduction > 0,
            },
          },
        },
      })
    );

    // 5. Create order
    const [order] = await Order.create(
      [
        {
          userId,
          products: orderProducts,
          name: user.name,
          email: user.email,
          totalAmount,
          address: payload.address,
          city: payload.city,
          postalCode: payload.postalCode,
          status: "pending",
          paymentMethod: "shurjopay",
          payment: false,
          paymentStatus: "Pending",
          transaction: {
            id: "",
            transactionStatus: "",
          },
        },
      ],
      { session }
    );

    // 6. Update product stocks
    if (bulkOperations.length > 0) {
      await ProductModel.bulkWrite(bulkOperations, { session });
    }

    // 7. Clear user's cart
    await User.findByIdAndUpdate(
      userId,
      { $set: { cartData: new Map() } },
      { session }
    );

    // payment gateway integration shurjopay
    const shurjopayPayload = {
      amount: totalAmount,
      order_id: order._id,
      currency: "BDT",
      customer_name: user.name,
      customer_email: user.email,
      customer_phone: payload.phone,
      customer_address: payload.address,
      customer_city: payload.city,
      customer_post_code: payload.postalCode,
      client_ip,
    };

    const payment = await orderUtils.makePaymentAsyn(shurjopayPayload);

    // Update transaction details in the order
    if (payment?.transactionStatus) {
      await Order.updateOne(
        { _id: order._id },
        {
          $set: {
            "transaction.id": payment.sp_order_id,
            "transaction.transactionStatus": payment.transactionStatus,
          },
        }
      );
    }

    await session.commitTransaction();
    return { order, checkout_url: payment?.checkout_url };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

const verifyPayment = async (
  order_id: string
): Promise<VerificationResponse[]> => {
  const verifyPayment = await orderUtils.verifyPaymentAsync(order_id);

  if (verifyPayment.length) {
    await Order.findOneAndUpdate(
      {
        "transaction.id": order_id,
      },
      {
        "transaction.bank_status": verifyPayment[0].bank_status,
        "transaction.sp_code": verifyPayment[0].sp_code,
        "transaction.sp_message": verifyPayment[0].sp_message,
        "transaction.transactionStatus": verifyPayment[0].transactionStatus,
        "transaction.method": verifyPayment[0].method,
        "transaction.date_time": verifyPayment[0].date_time,
        paymentStatus:
          verifyPayment[0].bank_status === "Success"
            ? "Paid"
            : verifyPayment[0].bank_status === "Failed"
            ? "Pending"
            : verifyPayment[0].bank_status === "Cancel"
            ? "Cancelled"
            : "Pending",
      }
    );
  }

  return verifyPayment;
};

const getAllOrdersFromDB = async () => {
  // const orders = await Order.find({}).populate("products.productId userId");
  const orders = await Order.find({});
  return orders;
};

const getUserOwnOrdersFromDB = async (userId: string) => {
  const result = await Order.find({ userId }).populate(
    "products.productId userId"
  );
  return result;
};

const updateOrderStatusFromDB = async (orderId: string, status: string) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError("Order not found", StatusCodes.NOT_FOUND);
  }

  const product = order.products.map((item) => {
    return {
      productId: item.productId,
      quantity: item.quantity,
    };
  });

  const productQuantity = product.map((item) => item.quantity);
  // console.log(productQuantity); from there i got data of quantity is: [ 2 ]

  const productData = await ProductModel.find({
    _id: { $in: product.map((item) => item.productId) },
  });

  if (status === "cancelled" && productData) {
    for (let i = 0; i < productData.length; i++) {
      const currentProduct = productData[i];
      const productItem = product.find(
        (item) => item.productId.toString() === currentProduct._id.toString()
      );

      if (productItem) {
        await ProductModel.findByIdAndUpdate(currentProduct._id, {
          $inc: { stock: productItem.quantity },
          $set: { inStock: true },
        });
      }
    }
  }

  const result = await Order.findOneAndUpdate(
    { _id: orderId },
    { status },
    { new: true }
  );

  return result;
};

export const orderService = {
  placeOrderIntoDBWithCOD,
  placeOrderIntoDBWithShurjopay,
  verifyPayment,
  getAllOrdersFromDB,
  getUserOwnOrdersFromDB,
  updateOrderStatusFromDB,
};
