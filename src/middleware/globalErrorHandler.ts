import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import config from "../config";
import { TErrorSource } from "../interface/globalInterface";
import handleZodError from "../errors/handleZodError";
import handleValidationError from "../errors/handleValidationError";
import handleCastError from "../errors/handleCastError";
import handleDuplicateError from "../errors/handleDuplicateError";
import AppError from "../errors/AppError";


const globalErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
  // setting default status code and message
  let statusCode = 500;
  let message = "Something went wrong";

  let errorSource: TErrorSource = [
    {
      path: "",
      message: "Something went wrong",
    },
  ];

  // checking it's zod error and mongoose validation error ->
  if (error instanceof ZodError) {
    const simplifiedError = handleZodError(error);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSource = simplifiedError?.errorSource;
  } //TODO : Mongoose validation error ->
  else if (error?.name === "ValidationError") {
    const simplifiedError = handleValidationError(error);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSource = simplifiedError?.errorSource;
  } //TODO : when we get any data from database with error handling ->
  else if (error?.name === "CastError") {
    const simplifiedError = handleCastError(error);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSource = simplifiedError?.errorSource;
  } //TODO : Checking duplicate name error ->
  else if (error?.code === 11000) {
    const simplifiedError = handleDuplicateError(error);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSource = simplifiedError?.errorSource;
  } //TODO : AppError custom error handling ->
  else if (error instanceof AppError) {
    statusCode = error?.statusCode;
    message = error?.message;
    errorSource = [
      {
        path: "",
        message: error?.message,
      },
    ];
  } //TODO : unknown error handling ->
  else if (error instanceof Error) {
    message = error?.message;
    errorSource = [
      {
        path: "",
        message: error?.message,
      },
    ];
  }

  // ultimate return
  res.status(statusCode).json({
    success: false,
    message: message,
    errorSource,
    error,
    stack: config.nodeEnv === "development" ? error.stack : null,
  });
};

export default globalErrorHandler;
