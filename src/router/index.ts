import { Router } from "express";
import { userRouter } from "../modules/user/user.router";
import { authRouter } from "../modules/auth/auth.router";


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
  //   {
  //     path: "/appointment",
  //     route: appointmentRoute,
  //   },
  //   {
  //     path: "/doctor",
  //     route: doctorRoute,
  //   },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
