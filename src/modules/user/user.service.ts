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

  const token = createToken(
    JwtPayload as any,
    config.jwt.jwtAccessTokenSecret as string,
    config.jwt.jwtAccessTokenExpiresIn as string
  );

  // send refresh token
  const refreshToken = createToken(
    JwtPayload as any,
    config.jwt.jwtRefreshTokenSecret as string,
    config.jwt.jwtRefreshTokenExpiresIn as string
  );

  return {
    user,
    token,
    refreshToken,
  };
};

export const userService = {
  registerUserInDB,
};
