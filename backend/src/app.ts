import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env, isOriginAllowed } from "./config/env";
import { requireHttps } from "./middlewares/httpsMiddleware";
import { serveUpload } from "./middlewares/uploadAccessMiddleware";
import { errorMiddleware, notFoundMiddleware } from "./middlewares/errorMiddleware";
import { routes } from "./routes";
import "./types";

export const app = express();

app.set("trust proxy", env.trustProxy);
app.use(requireHttps);

app.use(
  cors({
    origin: (origin, callback) => callback(null, isOriginAllowed(origin)),
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Fotos têm dados pessoais: só com link assinado e temporário (RS10).
app.use("/uploads", serveUpload);

app.get("/", (_req, res) => res.redirect("/api"));
app.use("/api", routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);
