import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import path from "path";
import { isOriginAllowed } from "./config/env";
import { errorMiddleware, notFoundMiddleware } from "./middlewares/errorMiddleware";
import { routes } from "./routes";
import "./types";

export const app = express();

app.use(
  cors({
    origin: (origin, callback) => callback(null, isOriginAllowed(origin)),
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Servir imagens enviadas pelos usuários
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

app.get("/", (_req, res) => res.redirect("/api"));
app.use("/api", routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);
