import { Types } from "mongoose";

export type TCart = {
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  quantity: number;
  size: string;
  price: number;
  name: string;
  image: string;
  isRemove: boolean;
};
