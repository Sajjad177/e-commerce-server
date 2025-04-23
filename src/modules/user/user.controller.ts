import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { userService } from "./user.service";

const registerUser = catchAsync(async (req, res) => {
  const result = await userService.registerUserInDB(req.body);

  const { refreshToken, accessToken, user } = result;
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false, // set to true in production
  });

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "User registered successfully",
    data: {
      user,
      accessToken,
    },
  });
});

const getAllUsers = catchAsync(async (req, res) => {
  const result = await userService.getAllUserFromDB();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Users retrieved successfully",
    data: result,
  });
});

const getSingelUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const result = await userService.singleUserFromDB(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User retrieved successfully",
    data: result,
  });
});

const toggleUserAvailability = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const result = await userService.toggleUserAvailabilityFromDB(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User availability toggled successfully",
    data: result,
  });
});

export const userController = {
  registerUser,
  getAllUsers,
  getSingelUser,
  toggleUserAvailability,
};
