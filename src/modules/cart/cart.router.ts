import express from "express";
import { cartController } from "./cart.controller";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../user/user.constant";

const router = express.Router();

router.post("/addto-cart", auth(USER_ROLE.user), cartController.addToCart);
router.get("/", cartController.getAllCart);

router.delete("/:cartId", cartController.removeFromCart);

export const cartRouter = router;
