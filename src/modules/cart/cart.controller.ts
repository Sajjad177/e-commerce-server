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

const getUserOwnCart = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const result = await cartService.getUserOwnCartFromDB(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Cart retrieved successfully",
    data: result,
  });
});

const removeFromCart = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { productId, size } = req.body;
  const result = await cartService.removeFromCartInDB(userId, productId, size);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Product removed from cart successfully",
    data: result,
  });
});

const updateQuantity = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const result = await cartService.updateCartQuantity(req.body, userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Product quantity updated successfully",
    data: result,
  });
});

export const cartController = {
  addToCart,
  getUserOwnCart,
  updateQuantity,
  removeFromCart,
};
