import { NextFunction, Request, Response } from "express";
import AppError from "../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { verifyToken } from "../utils/tokenGenerate";
import config from "../config";

const auth = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        throw new AppError("Invalid token", StatusCodes.UNAUTHORIZED);
      }

      const verifyUserData = verifyToken(
        token,
        config.jwt.jwtAccessTokenSecret as string
      );

      req.user = verifyUserData;

      if (roles.length && !roles.includes(verifyUserData.role)) {
        throw new AppError("You are not authorized!", StatusCodes.UNAUTHORIZED);
      }

      next();
    } catch (error) {
      console.log(error);
      throw new AppError("You are not authorized", StatusCodes.UNAUTHORIZED);
    }
  };
};

export default auth;
