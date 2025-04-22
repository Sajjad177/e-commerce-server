import express, { Application, RequestHandler } from "express";
import cors from "cors";
import globalErrorHandler from "./middleware/globalErrorHandler";
import notFound from "./middleware/notFound";
// import router from "./router";

const app: Application = express();

app.use(express.json());

const corseOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    // "https://health-bridge-frontend-jet.vercel.app",
  ],
  credentials: true,
};

app.use(cors(corseOptions));

// app.use("/api", router);

app.get("/", (req, res) => {
  res.send("Hey there! Welcome to E-Commerce platform.");
});

app.use(globalErrorHandler as unknown as RequestHandler);
app.use(notFound as unknown as RequestHandler);

export default app;
