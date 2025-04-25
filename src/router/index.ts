import { Router } from "express";
import { userRouter } from "../modules/user/user.router";
import { authRouter } from "../modules/auth/auth.router";
import { productRoute } from "../modules/product/product.route";
import { orderRouter } from "../modules/order/order.router";
import { cartRouter } from "../modules/cart/cart.router";

const router = Router();

const moduleRoutes = [
  {
    path: "/user",
    route: userRouter,
  },
  {
    path: "/auth",
    route: authRouter,
  },
  {
    path: "/product",
    route: productRoute,
  },
  {
    path: "/order",
    route: orderRouter,
  },
  {
    path: "/cart",
    route: cartRouter,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
