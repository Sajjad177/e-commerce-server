import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { User } from "../user/user.model";
import { TAuthUser } from "./auth.interface";
import { createToken, verifyToken } from "../../utils/tokenGenerate";
import config from "../../config";
import { emailSender } from "../../utils/emailSender";
import bcrypt from "bcrypt";

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
    user,
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

const forgotUserPassword = async (payload: { email: string }) => {
  const userData = await User.isUserExistByEmail(payload.email);
  if (!userData) {
    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }

  const JwtPayload = {
    userId: userData._id,
    role: userData.role,
    email: userData.email,
  };

  const forgotPasswordToken = createToken(
    JwtPayload as any,
    config.reset.reset_password_token_secret as string,
    config.reset.reset_password_token_expires as string
  );

  const resetPasswordLink =
    config.reset.reset_url +
    `?email=${userData.email}&token=${forgotPasswordToken}`;

  await emailSender(
    userData.email,
    `
  <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f7f7f7;">
    <div style="max-width: 600px; margin: auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <h2 style="color: #333;">Hello ${userData.email.split("@")[0]},</h2>
      <p style="color: #555; font-size: 16px;">
        You requested to reset your password. Please click the button below to continue:
      </p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${resetPasswordLink}" 
           style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 16px;">
          Reset Password
        </a>
      </div>
      <p style="color: #999; font-size: 14px;">
        If you didn’t request this, you can safely ignore this email.
      </p>
    </div>
  </div>
  `
  );
};

const resetUserPassword = async (
  payload: { email: string; password: string },
  token: string
) => {
  const userData = await User.isUserExistByEmail(payload.email);
  if (!userData) {
    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }

  const isValidToken = verifyToken(
    token,
    config.reset.reset_password_token_secret as string
  );
  if (!isValidToken) {
    throw new AppError("Invalid token", StatusCodes.UNAUTHORIZED);
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    Number(config.bcryptSaltRounds)
  );

  await User.findOneAndUpdate(
    {
      email: isValidToken.email,
    },
    {
      password: hashedPassword,
    }
  );
};

export const authService = {
  loginUserInDB,
  LoginRefreshToken,
  forgotUserPassword,
  resetUserPassword,
};
