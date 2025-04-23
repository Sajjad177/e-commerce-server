import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { TUser } from "./user.interface";
import { User } from "./user.model";
import { createToken } from "../../utils/tokenGenerate";
import config from "../../config";

const registerUserInDB = async (payload: TUser) => {
  // Check if the user already exists
  const isExists = await User.isUserExistByEmail(payload.email);
  if (isExists) {
    throw new AppError("User already exists", StatusCodes.BAD_REQUEST);
  }

  const user = await User.create(payload);

  const JwtPayload = {
    userId: user._id,
    role: user.role,
    email: user.email,
  };

  const accessToken = createToken(
    JwtPayload as any,
    config.jwt.jwtAccessTokenSecret as string,
    config.jwt.jwtAccessTokenExpiresIn as string
  );

  // send refresh token
  const refreshToken = createToken(
    JwtPayload as any,
    config.jwt.refreshTokenSecret as string,
    config.jwt.jwtRefreshTokenExpiresIn as string
  );

  return {
    user,
    accessToken,
    refreshToken,
  };
};

const getAllUserFromDB = async () => {
  const users = await User.find({}).select("-password -refreshToken -__v");

  if (!users) {
    throw new AppError("No users found", StatusCodes.NOT_FOUND);
  }

  return users;
};

const singleUserFromDB = async (userId: string) => {
  const user = await User.findById(userId).select(
    "-password -refreshToken -__v"
  );

  if (!user) {
    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }

  return user;
};

const toggleUserAvailabilityFromDB = async (userId: string) => {
  const user = await User.findById(userId).select("-password -__v");

  if (!user) {
    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }

  const result = await User.findByIdAndUpdate(
    userId,
    { isDeleted: !user.isDeleted },
    { new: true }
  );

  return result;
};

export const userService = {
  registerUserInDB,
  getAllUserFromDB,
  singleUserFromDB,
  toggleUserAvailabilityFromDB,
};
