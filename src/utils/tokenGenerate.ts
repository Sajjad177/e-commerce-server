import jwt, { JwtPayload } from "jsonwebtoken";

export const createToken = (
  JwtPayload: { userId: string; role: string },
  secret: string,
  expiresIn: string
) => {
  return jwt.sign(JwtPayload, secret, {
    expiresIn,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string, secret: string) => {
  return jwt.verify(token, secret) as JwtPayload;
};
