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

export const userController = {
  registerUser,
};
