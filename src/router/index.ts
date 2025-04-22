import { Router } from "express";


const router = Router();


const moduleRoutes = [
  {
    path: "/user",
    route: "userRoute",
  },
//   {
//     path: "/appointment",
//     route: appointmentRoute,
//   },
//   {
//     path: "/doctor",
//     route: doctorRoute,
//   },
//   {
//     path: "/auth",
//     route: authRoute,
//   },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
