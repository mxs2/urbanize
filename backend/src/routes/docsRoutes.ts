import fs from "fs";
import path from "path";
import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";

/** Especificação OpenAPI em backend/openapi.yaml, lida uma vez na subida. */
export const openApiSpec = YAML.parse(fs.readFileSync(path.resolve(__dirname, "..", "..", "openapi.yaml"), "utf8"));

export const docsRoutes = Router();

// JSON bruto para importar no Postman/Insomnia ("Import > URL").
docsRoutes.get("/openapi.json", (_req, res) => res.json(openApiSpec));
docsRoutes.use("/", swaggerUi.serve, swaggerUi.setup(openApiSpec, { customSiteTitle: "Urbanize API" }));
