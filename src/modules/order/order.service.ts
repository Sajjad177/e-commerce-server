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

    const cartData = user.cartData.toObject();
    if (!cartData || Object.keys(cartData).length === 0) {
      throw new AppError("Cart is empty", StatusCodes.BAD_REQUEST);
    }

    // 2. Process cart items
    let totalAmount = 0;
    const orderProducts = [];
    const productUpdates = [];

    // Get all product IDs at once for efficiency
    const productIds = Object.keys(cartData);
    const products = await ProductModel.find({
      _id: { $in: productIds },
    }).session(session);

    for (const [productId, sizeData] of Object.entries(cartData)) {
      const product = products.find((p) => p._id.toString() === productId);
      if (!product) {
        throw new AppError(
          `Product ${productId} not found`,
          StatusCodes.NOT_FOUND
        );
      }

      // Calculate total quantity across all sizes for this product
      let totalQuantityForProduct = 0;
      const sizeEntries = [];

      for (const [size, cartItem] of Object.entries(sizeData)) {
        // Validate size exists in product
        if (!product.size.includes(size)) {
          throw new AppError(
            `Size ${size} not available for product ${product.name}`,
            StatusCodes.BAD_REQUEST
          );
        }

        totalQuantityForProduct += cartItem.quantity;
        sizeEntries.push({ size, ...cartItem });
      }

      // Check overall stock (since we can't track per-size)
      if (product.stock < totalQuantityForProduct) {
        throw new AppError(
          `Insufficient stock for ${product.name}`,
          StatusCodes.BAD_REQUEST
        );
      }

      // Add each size variant to order
      sizeEntries.forEach(({ size, quantity, price, name, image }) => {
        orderProducts.push({
          productId: product._id,
          quantity,
          size,
          price,
          name,
          image,
        });

        totalAmount += quantity * price;
      });

      // Prepare stock update (single update per product)
      productUpdates.push({
        updateOne: {
          filter: { _id: product._id },
          update: {
            $inc: { stock: -totalQuantityForProduct },
            $set: { isStock: product.stock - totalQuantityForProduct > 0 },
          },
        },
      });
    }

    // 3. Create the order
    const order = await OrderModel.create(
      [
        {
          user: userId,
          products: orderProducts,
          totalAmount,
          shippingAddress: payload.address,
          paymentMethod: "cod",
          paymentStatus: "Pending",
          status: "pending",
        },
      ],
      { session }
    );

    // 4. Update product stocks
    if (productUpdates.length > 0) {
      await ProductModel.bulkWrite(productUpdates, { session });
    }

    // 5. Clear user's cart
    await User.findByIdAndUpdate(
      userId,
      { $set: { cartData: {} } },
      { session }
    );

    await session.commitTransaction();
    await session.endSession();

    return {
      success: true,
      message: "Order placed successfully",
      data: order[0],
    };
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
};
//!---------------------------------------------------

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

  // 6. Prepare products array for order
  const orderProducts = products.map((item) => ({
    productId: new Types.ObjectId(item.productId),
    quantity: item.quantity,
  }));

  const newOrder = await Order.create({
    userId,
    products: orderProducts,
    name: isUserExist.name,
    email: isUserExist.email,
    amount: totalAmount,
    address: payload.address,
    city: payload.city,
    postalCode: payload.postalCode,
    paymentMethod: "shurjopay",
    payment: false,
    paymentStatus: "Pending",
    transaction: {
      id: "",
      transactionStatus: "",
    },
  });

  // 8. Optionally, add order to user's cart/history
  await User.findByIdAndUpdate(
    userId,
    {
      $push: { cartData: newOrder._id },
    },
    { new: true }
  );

  // payment gateway integration shurjopay
  const shurjopayPayload = {
    amount: totalAmount,
    order_id: newOrder._id,
    currency: "BDT",
    customer_name: isUserExist.name,
    customer_email: isUserExist.email,
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
      { _id: newOrder._id },
      {
        $set: {
          "transaction.id": payment.sp_order_id,
          "transaction.transactionStatus": payment.transactionStatus,
        },
      }
    );
  }

  return { newOrder, checkout_url: payment?.checkout_url };
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
