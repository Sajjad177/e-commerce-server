import { Types } from "mongoose";

export type TOrder = {
  userId: Types.ObjectId;
  products: Types.ObjectId[];
  totalAmount: number;
  address: string;
  status: "pending" | "delivered" | "cancelled";
  paymentMethod: string;
  payment: boolean;
  paymentStatus: "Pending" | "Paid" | "Failed" | "Cancelled";
  transaction: {
    id: string;
    transactionStatus: string;
    bank_status: string;
    sp_code: string;
    sp_message: string;
    method: string;
    date_time: string;
  };
};
