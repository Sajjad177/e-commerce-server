import { Model, Types } from "mongoose";

interface CartData {
  productId: Types.ObjectId;
  size: string;
  quantity: number;
  name: string;
  price: number;
  image: string;
}

export interface TUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  cartData: CartData;
  isDeleted: boolean;
  role: "user" | "superAdmin";
}

export interface UserModel extends Model<TUser> {
  isPasswordMatch(password: string, hashedPassword: string): Promise<boolean>;
  isUserExistByEmail(email: string): Promise<TUser>;
  isUserExistById(id: string): Promise<TUser>;
  isUserDeleted(isDeleted: boolean): Promise<TUser>;
}
