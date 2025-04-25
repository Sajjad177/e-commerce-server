import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { cartService } from "./cart.service";

const addToCart = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const result = await cartService.addToCartInDB(req.body, userId);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Product added to cart successfully",
    data: result,
  });
});

const getAllCart = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const result = await cartService.getAllCartFromDB(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Cart retrieved successfully",
    data: result,
  });
});

//* update is not done-------------------------
const updateCart = catchAsync(async (req, res) => {});

const removeFromCart = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { cartId } = req.params;
  const result = await cartService.removeFromCartInDB(userId, cartId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Product removed from cart successfully",
    data: result,
  });
});

export const cartController = {
  addToCart,
  getAllCart,
  updateCart,
  removeFromCart,
};
