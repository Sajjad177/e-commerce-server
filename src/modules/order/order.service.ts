// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { User } from "../user/user.model";
import { ProductModel } from "../product/product.model";
import { Order } from "./order.model";
// import { orderUtils } from "./order.utils";
import { VerificationResponse } from "shurjopay";
import { orderUtils } from "./order.utils";

interface CartItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  size: string;
  price: number;
  name: string;
  images: string[];
}

interface OrderPayload {
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  name: string;
}

const placeOrderIntoDBWithCOD = async (
  payload: OrderPayload,
  userId: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Validate inputs
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError("Invalid user ID", StatusCodes.BAD_REQUEST);
    }

    // 2. Get user with cart data
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }

    // 3. Validate cart data
    if (
      !user.cartData ||
      !(user.cartData instanceof Map) ||
      user.cartData.size === 0
    ) {
      throw new AppError("Cart is empty", StatusCodes.BAD_REQUEST);
    }

    // 4. Convert cart data to array and validate
    const cartItems = Array.from(user.cartData.values());
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      throw new AppError("Invalid cart items", StatusCodes.BAD_REQUEST);
    }

    // 5. Get all unique product IDs with validation
    const productIds = cartItems
      .map((item) => item?.productId)
      .filter(Boolean)
      .map((id) => new mongoose.Types.ObjectId(id));

    if (productIds.length === 0) {
      throw new AppError("No valid products in cart", StatusCodes.BAD_REQUEST);
    }

    // 6. Fetch products with stock validation
    const products = await ProductModel.find({
      _id: { $in: productIds },
      inStock: true,
    }).session(session);

    if (!products || products.length === 0) {
      throw new AppError(
        "No products found or all out of stock",
        StatusCodes.BAD_REQUEST
      );
    }

    // 7. Process order items with proper error handling
    let totalAmount = 0;
    const orderProducts = [];
    const stockUpdates = new Map();

    for (const cartItem of cartItems) {
      try {
        if (!cartItem?.productId || !cartItem?.quantity) {
          console.warn("Invalid cart item skipped:", cartItem);
          continue;
        }

        const product = products.find(
          (p) => p._id.toString() === cartItem.productId.toString()
        );

        if (!product) {
          throw new AppError(
            `Product ${cartItem.productId} not found`,
            StatusCodes.NOT_FOUND
          );
        }

        // Initialize stock tracking
        if (!stockUpdates.has(product._id.toString())) {
          stockUpdates.set(product._id.toString(), {
            currentStock: product.stock,
            totalDeduction: 0,
          });
        }

        const stockInfo = stockUpdates.get(product._id.toString());
        const requestedQty = cartItem.quantity;

        // Validate stock
        if (stockInfo.currentStock < requestedQty) {
          throw new AppError(
            `Insufficient stock for ${product.name}. Available: ${stockInfo.currentStock}, Requested: ${requestedQty}`,
            StatusCodes.BAD_REQUEST
          );
        }

        // Update tracking
        stockInfo.currentStock -= requestedQty;
        stockInfo.totalDeduction += requestedQty;

        // Add to order
        orderProducts.push({
          productId: product._id,
          quantity: requestedQty,
          size: cartItem.size || "M",
          price: cartItem.price || product.price,
          name: cartItem.name || product.name,
          image: cartItem.images?.[0] || product.images?.[0] || "",
          orderStatus: "pending",
        });

        totalAmount += requestedQty * (cartItem.price || product.price);
      } catch (error) {
        console.error(
          `Error processing cart item ${cartItem.productId}:`,
          error
        );
        throw error; // Re-throw to abort transaction
      }
    }

    // 8. Validate we have items to order
    if (orderProducts.length === 0) {
      throw new AppError("No valid items to order", StatusCodes.BAD_REQUEST);
    }

    // 9. Prepare bulk operations with validation
    const bulkOperations = Array.from(stockUpdates.entries()).map(
      ([id, info]) => {
        if (!info || typeof info.totalDeduction !== "number") {
          throw new AppError(
            "Invalid stock update data",
            StatusCodes.INTERNAL_SERVER_ERROR
          );
        }

        return {
          updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(id) },
            update: {
              $inc: { stock: -info.totalDeduction },
              $set: {
                inStock: info.currentStock - info.totalDeduction > 0,
              },
            },
          },
        };
      }
    );

    // 10. Create order with all required fields
    const orderData = {
      userId: new mongoose.Types.ObjectId(userId),
      products: orderProducts,
      totalAmount,
      status: "pending",
      paymentMethod: "cod",
      payment: false,
      paymentStatus: "Pending",
      address: payload.address,
      city: payload.city,
      postalCode: payload.postalCode,
      phone: payload.phone,
      name: payload.name,
    };

    const [order] = await Order.create([orderData], { session });

    // 11. Update product stocks if needed
    if (bulkOperations.length > 0) {
      await ProductModel.bulkWrite(bulkOperations, { session });
    }

    // 12. Clear user's cart
    await User.findByIdAndUpdate(
      userId,
      { $set: { cartData: new Map() } },
      { session }
    );

    await session.commitTransaction();
    return order;
  } catch (error) {
    await session.abortTransaction();
    console.error("Order placement failed:", error);
    throw error;
  } finally {
    await session.endSession();
  }
};

const placeOrderIntoDBWithShurjopay = async (
  payload: OrderPayload,
  userId: string,
  client_ip: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log(payload);
    // 1. Validate inputs
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError("Invalid user ID", StatusCodes.BAD_REQUEST);
    }

    // 1. Get user with cart data
    const user = await User.findById(userId).session(session);
    console.log(user);
    if (!user) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }

    // 3. Validate cart data
    if (
      !user.cartData ||
      !(user.cartData instanceof Map) ||
      user.cartData.size === 0
    ) {
      throw new AppError("Cart is empty", StatusCodes.BAD_REQUEST);
    }

    // 4. Convert cart data to array and validate
    const cartItems = Array.from(user.cartData.values());
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      throw new AppError("Invalid cart items", StatusCodes.BAD_REQUEST);
    }

    // 5. Get all unique product IDs with validation
    const productIds = cartItems
      .map((item) => item?.productId)
      .filter(Boolean)
      .map((id) => new mongoose.Types.ObjectId(id));

    if (productIds.length === 0) {
      throw new AppError("No valid products in cart", StatusCodes.BAD_REQUEST);
    }

    // 6. Fetch products with stock validation
    const products = await ProductModel.find({
      _id: { $in: productIds },
      inStock: true,
    }).session(session);

    if (!products || products.length === 0) {
      throw new AppError(
        "No products found or all out of stock",
        StatusCodes.BAD_REQUEST
      );
    }

    // 7. Process order items with proper error handling
    let totalAmount = 0;
    const orderProducts = [];
    const stockUpdates = new Map();

    for (const cartItem of cartItems) {
      try {
        if (!cartItem?.productId || !cartItem?.quantity) {
          console.warn("Invalid cart item skipped:", cartItem);
          continue;
        }

        const product = products.find(
          (p) => p._id.toString() === cartItem.productId.toString()
        );

        if (!product) {
          throw new AppError(
            `Product ${cartItem.productId} not found`,
            StatusCodes.NOT_FOUND
          );
        }

        // Initialize stock tracking
        if (!stockUpdates.has(product._id.toString())) {
          stockUpdates.set(product._id.toString(), {
            currentStock: product.stock,
            totalDeduction: 0,
          });
        }

        const stockInfo = stockUpdates.get(product._id.toString());
        const requestedQty = cartItem.quantity;

        // Validate stock
        if (stockInfo.currentStock < requestedQty) {
          throw new AppError(
            `Insufficient stock for ${product.name}. Available: ${stockInfo.currentStock}, Requested: ${requestedQty}`,
            StatusCodes.BAD_REQUEST
          );
        }

        // Update tracking
        stockInfo.currentStock -= requestedQty;
        stockInfo.totalDeduction += requestedQty;

        // Add to order
        orderProducts.push({
          productId: product._id,
          quantity: requestedQty,
          size: cartItem.size || "M",
          price: cartItem.price || product.price,
          name: cartItem.name || product.name,
          image: cartItem.images?.[0] || product.images?.[0] || "",
          orderStatus: "pending",
        });

        totalAmount += requestedQty * (cartItem.price || product.price);
      } catch (error) {
        console.error(
          `Error processing cart item ${cartItem.productId}:`,
          error
        );
        throw error; // Re-throw to abort transaction
      }
    }

    // 8. Validate we have items to order
    if (orderProducts.length === 0) {
      throw new AppError("No valid items to order", StatusCodes.BAD_REQUEST);
    }

    // 9. Prepare bulk operations with validation
    const bulkOperations = Array.from(stockUpdates.entries()).map(
      ([id, info]) => {
        if (!info || typeof info.totalDeduction !== "number") {
          throw new AppError(
            "Invalid stock update data",
            StatusCodes.INTERNAL_SERVER_ERROR
          );
        }

        return {
          updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(id) },
            update: {
              $inc: { stock: -info.totalDeduction },
              $set: {
                inStock: info.currentStock - info.totalDeduction > 0,
              },
            },
          },
        };
      }
    );

    const orderData = {
      userId: new mongoose.Types.ObjectId(userId),
      products: orderProducts,
      totalAmount,
      status: "pending",
      payment: false,
      paymentMethod: "shurjopay",
      paymentStatus: "Pending",
      address: payload.address,
      city: payload.city,
      postalCode: payload.postalCode,
      phone: payload.phone,
      name: payload.name,
      transaction: {
        id: "",
        transactionStatus: "",
      },
    };

    const [order] = await Order.create([orderData], { session });
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

    // Payment gateway integration - ShurjoPay
    const shurjopayPayload = {
      amount: totalAmount,
      order_id: order._id.toString(),
      currency: "BDT",
      customer_name: payload.name || user.name,
      customer_email: user.email,
      customer_phone: payload.phone || user.phone || "017****",
      customer_address:
        payload.address || user.address || "Address not provided",
      customer_city: payload.city || user.city || "City not provided",
      customer_post_code: payload.postalCode || "510000",
      client_ip,
    };

    const paymentResponse = await orderUtils.makePaymentAsyn(shurjopayPayload);

    // 3. Update the order with payment details
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: order._id },
      {
        $set: {
          "transaction.id": paymentResponse.sp_order_id,
          "transaction.transactionStatus": paymentResponse.transactionStatus,
        },
      },
      { new: true, session }
    );

    await session.commitTransaction();
    return { order, checkout_url: paymentResponse.checkout_url };
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
  const result = await Order.find({ userId });
  return result;
};

const updateOrderStatusFromDB = async (
  orderId: string,
  payload: {
    productId: string;
    size: string;
    orderStatus: string;
  }
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Validate all required fields exist
    if (!payload.productId || !payload.orderStatus) {
      throw new AppError("Missing required fields", StatusCodes.BAD_REQUEST);
    }

    // 2. Normalize and validate size (handle undefined/null)
    const normalizedSize = payload.size
      ? payload.size.trim().toLowerCase()
      : "unassigned";

    // 3. Get the order with proper error handling
    const order = await Order.findById(orderId).session(session);
    if (!order) {
      throw new AppError("Order not found", StatusCodes.NOT_FOUND);
    }

    // 4. Convert productId to ObjectId with validation
    let productIdToFind;
    try {
      productIdToFind = new mongoose.Types.ObjectId(payload.productId.trim());
    } catch (err) {
      throw new AppError("Invalid product ID format", StatusCodes.BAD_REQUEST);
    }

    // 6. Find the product with proper null checks
    const productItem = order.products.find((item) => {
      if (!item || !item.productId) return false;

      // Convert both IDs to strings for comparison
      const itemProductId = item.productId.toString();
      const searchProductId = productIdToFind.toString();

      // Normalize sizes
      const itemSize = item.size
        ? item.size.trim().toLowerCase()
        : "unassigned";

      console.log("Comparison:", {
        itemProductId,
        searchProductId,
        itemSize,
        searchSize: normalizedSize,
        idMatch: itemProductId === searchProductId,
        sizeMatch: itemSize === normalizedSize,
        fullMatch:
          itemProductId === searchProductId && itemSize === normalizedSize,
      });

      return itemProductId === searchProductId && itemSize === normalizedSize;
    });

    // 7. Validate product was found
    if (!productItem || !productItem.orderStatus) {
      throw new AppError(
        `Product not found in order. Details: ${JSON.stringify({
          searchedProductId: payload.productId,
          searchedSize: payload.size,
          normalizedSize,
          availableProducts: order.products.map((p) => ({
            productId: p.productId?.toString(),
            size: p.size,
            normalizedSize: p.size ? p.size.trim().toLowerCase() : "unassigned",
            hasOrderStatus: !!p.orderStatus,
          })),
        })}`,
        StatusCodes.NOT_FOUND
      );
    }

    const originalStatus = productItem.orderStatus;

    // 8. Handle stock changes if status is changing to/from cancelled
    if (payload.orderStatus === "cancelled" || originalStatus === "cancelled") {
      const product = await ProductModel.findById(payload.productId).session(
        session
      );
      if (!product) {
        throw new AppError(
          "Product not found in inventory",
          StatusCodes.NOT_FOUND
        );
      }

      // Calculate stock adjustment
      const stockAdjustment =
        (payload.orderStatus === "cancelled" ? 1 : -1) *
        (productItem.quantity || 0);

      await ProductModel.findByIdAndUpdate(
        payload.productId,
        {
          $inc: { stock: stockAdjustment },
          $set: {
            inStock: product.stock + stockAdjustment > 0,
          },
        },
        { session }
      );
    }

    // 9. Update the order status
    const updateQuery: any = {
      $set: {
        "products.$[elem].orderStatus": payload.orderStatus,
      },
    };

    // 10. Check if all products now have same status
    const allSameStatus = order.products.every(
      (p) =>
        p.orderStatus === payload.orderStatus ||
        (p._id.equals(productItem._id) && payload.orderStatus)
    );

    if (allSameStatus) {
      updateQuery.$set.status = payload.orderStatus;
      if (payload.orderStatus === "cancelled") {
        updateQuery.$set.paymentStatus = "Cancelled";
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(orderId, updateQuery, {
      arrayFilters: [
        {
          "elem.productId": productIdToFind,
          "elem.size": payload.size || { $exists: false },
        },
      ],
      new: true,
      session,
    });

    await session.commitTransaction();
    return updatedOrder;
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    throw error;
  } finally {
    await session.endSession();
  }
};

export const orderService = {
  placeOrderIntoDBWithCOD,
  placeOrderIntoDBWithShurjopay,
  verifyPayment,
  getAllOrdersFromDB,
  getUserOwnOrdersFromDB,
  updateOrderStatusFromDB,
};
