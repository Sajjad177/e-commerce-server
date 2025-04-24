import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { orderService } from "./order.service";

const placeOrderWithCOD = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const result = await orderService.placeOrderIntoDBWithCOD(req.body, userId);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Order placed successfully",
    data: result,
  });
});

const placeOrderWithShurjopay = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const result = await orderService.placeOrderIntoDBWithShurjopay(
    req.body,
    userId,
    req.ip!
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Order placed successfully",
    data: result,
  });
});

const verifyPayment = catchAsync(async (req, res) => {
  const order = await orderService.verifyPayment(req.query.order_id as string);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Payment verified successfully",
    data: order,
  });
});

const getAllOrders = catchAsync(async (req, res) => {
  const result = await orderService.getAllOrdersFromDB();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Orders retrieved successfully",
    data: result,
  });
});

const getUserOwnOrders = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const result = await orderService.getUserOwnOrdersFromDB(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Orders retrieved successfully",
    data: result,
  });
});

const updateOrderStatus = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  const result = await orderService.updateOrderStatusFromDB(orderId, status);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Order status updated successfully",
    data: result,
  });
});

export const orderController = {
  placeOrderWithCOD,
  placeOrderWithShurjopay,
  verifyPayment,
  getAllOrders,
  getUserOwnOrders,
  updateOrderStatus,
};
