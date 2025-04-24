import express from "express";
import { orderController } from "./order.controller";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../user/user.constant";

const router = express.Router();

router.post(
  "/cod-order",
  auth(USER_ROLE.user),
  orderController.placeOrderWithCOD
);
router.post("/stripe-order", orderController.placeOrderWithStripe);
router.post("/shurjopay-order", orderController.placeOrderWithShurjopay);

router.get("/", orderController.getAllOrders);
router.get("/own", auth(USER_ROLE.user), orderController.getUserOwnOrders);

router.patch("/:orderId", orderController.updateOrderStatus);

export const orderRouter = router;
