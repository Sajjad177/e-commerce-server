import express from "express";
import { userController } from "./user.controller";
import validateRequest from "../../middleware/validateRequest";
import { userValidation } from "./user.validation";

const router = express.Router();

router.post(
  "/register",
  validateRequest(userValidation.userRegisterValidation),
  userController.registerUser
);

export const userRouter = router;
