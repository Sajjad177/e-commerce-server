import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { User } from "../user/user.model";
import { TAuthUser } from "./auth.interface";
import { createToken, verifyToken } from "../../utils/tokenGenerate";
import config from "../../config";

const loginUserInDB = async (payload: TAuthUser) => {
  const user = await User.isUserExistByEmail(payload.email);
  if (!user) {
    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }

  const isUserDeleted = user.isDeleted;
  if (isUserDeleted) {
    throw new AppError("User is deleted", StatusCodes.NOT_FOUND);
  }

  if (!(await User.isPasswordMatch(payload.password, user?.password))) {
    throw new AppError("Password is incorrect", StatusCodes.UNAUTHORIZED);
  }

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

  const refreshToken = createToken(
    JwtPayload as any,
    config.jwt.refreshTokenSecret as string,
    config.jwt.jwtRefreshTokenExpiresIn as string
  );

  return {
    accessToken,
    refreshToken,
  };
};

const LoginRefreshToken = async (token: string) => {
  let decodedToken;

  try {
    decodedToken = verifyToken(token, config.jwt.refreshTokenSecret as string);

    if (!decodedToken) {
      throw new AppError("Invalid token", StatusCodes.UNAUTHORIZED);
    }
  } catch (error) {
    throw new AppError("You are not authorized", StatusCodes.UNAUTHORIZED);
  }

  const userData = await User.isUserExistByEmail(decodedToken?.email);
  if (!userData) {
    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }

  const JwtPayload = {
    userId: userData._id,
    role: userData.role,
    email: userData.email,
  };

  const accessToken = createToken(
    JwtPayload as any,
    config.jwt.jwtAccessTokenSecret as string,
    config.jwt.jwtAccessTokenExpiresIn as string
  );

  return { accessToken };
};

export const authService = {
  loginUserInDB,
  LoginRefreshToken,
};
