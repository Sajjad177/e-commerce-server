import express from "express";
import { orderController } from "./order.controller";

const router = express.Router();

router.post("/cod-order", orderController.placeOrderWithCOD);
router.post("/stripe-order", orderController.placeOrderWithStripe);
router.post("/shurjopay-order", orderController.placeOrderWithShurjopay);

router.get("/", orderController.getAllOrders);
router.get("/user-order", orderController.getUserOwnOrders);
router.patch("/:orderId", orderController.updateOrderStatus);

export const orderRouter = router;
