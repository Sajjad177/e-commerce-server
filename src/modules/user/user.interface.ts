import { Model, Types } from "mongoose";

export interface TUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  cartData: Types.ObjectId[];
  isDeleted: boolean;
  role: "user" | "superAdmin";
}

export interface UserModel extends Model<TUser> {
  isPasswordMatch(password: string, hashedPassword: string): Promise<boolean>;
  isUserExistByEmail(email: string): Promise<TUser>;
  isUserExistById(id: string): Promise<TUser>;
  isUserDeleted(isDeleted: boolean): Promise<TUser>;
}
