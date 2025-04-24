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

const placeOrderWithStripe = catchAsync(async (req, res) => {
  const result = await orderService.placeOrderIntoDBWithStripe(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Order placed successfully",
    data: result,
  });
});

//! Shurjopay payment will do it later--------------------------------
const placeOrderWithShurjopay = catchAsync(async (req, res) => {});

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
  const { userId } = req.params;
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
  placeOrderWithStripe,
  placeOrderWithShurjopay,
  getAllOrders,
  getUserOwnOrders,
  updateOrderStatus,
};
