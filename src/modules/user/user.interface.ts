import { Types } from "mongoose";

export interface TUser {
  name: {
    type: string;
    required: true;
  };
  email: {
    type: string;
    required: true;
    unique: true;
  };
  password: {
    type: string;
    required: true;
  };
  cartData: Types.ObjectId[];
  isDeleted: {
    type: boolean;
    default: false;
  };
}
