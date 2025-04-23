import { TOrder } from "./order.interface";

const placeOrderIntoDBWithCOD = async (order: TOrder, userId: string) => {};

const placeOrderIntoDBWithStripe = async (order: any) => {};

const placeOrderIntoDBWithShurjopay = async (order: any) => {};

const getAllOrdersFromDB = async () => {};

const getUserOwnOrdersFromDB = async (userId: string) => {};

const updateOrderStatusFromDB = async (orderId: string, status: string) => {};

export const orderService = {
  placeOrderIntoDBWithCOD,
  placeOrderIntoDBWithStripe,
  placeOrderIntoDBWithShurjopay,
  getAllOrdersFromDB,
  getUserOwnOrdersFromDB,
  updateOrderStatusFromDB,
};
