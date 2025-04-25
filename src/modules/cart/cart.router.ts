import express from "express";
import { cartController } from "./cart.controller";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../user/user.constant";

const router = express.Router();

router.post("/addto-cart", auth(USER_ROLE.user), cartController.addToCart);
router.get("/", auth(USER_ROLE.user), cartController.getUserOwnCart);

router.patch( 
  "/update-quantity",
  auth(USER_ROLE.user),
  cartController.updateQuantity
);

router.delete(
  "/remove-from-cart",
  auth(USER_ROLE.user),
  cartController.removeFromCart
);

export const cartRouter = router;
