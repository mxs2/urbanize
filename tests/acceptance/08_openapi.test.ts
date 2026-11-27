import request from "supertest";
import { app } from "../../backend/src/app";
import { authRoutes } from "../../backend/src/routes/authRoutes";
import { demandRoutes } from "../../backend/src/routes/demandRoutes";
import { metricsRoutes } from "../../backend/src/routes/metricsRoutes";
import { notificationRoutes } from "../../backend/src/routes/notificationRoutes";
import { organRoutes } from "../../backend/src/routes/organRoutes";
import { uploadRoutes } from "../../backend/src/routes/uploadRoutes";

type Layer = { route?: { path: string; methods: Record<string, boolean> } };

// O Express 5 não guarda no layer o prefixo em que o router foi montado, então o
// mapa espelha os routes.use(...) de backend/src/routes/index.ts.
const MOUNTED = {
  "/auth": authRoutes,
  "/demands": demandRoutes,
  "/metrics": metricsRoutes,
  "/upload": uploadRoutes,
  "/organs": organRoutes,
  "/notifications": notificationRoutes,
};

/** "METHOD /caminho" de cada rota registrada, relativo a /api. */
const listRoutes = (): string[] => [
  "GET /health",
  ...Object.entries(MOUNTED).flatMap(([prefix, router]) =>
    (router as unknown as { stack: Layer[] }).stack
      .filter((layer) => layer.route)
      .flatMap((layer) =>
        Object.keys(layer.route!.methods).map(
          (method) => `${method.toUpperCase()} ${prefix}${layer.route!.path === "/" ? "" : layer.route!.path}`
        )
      )
  ),
];

const toOpenApiPath = (expressPath: string) => expressPath.replace(/:(\w+)/g, "{$1}");

describe("SUT API Tests - Documentação OpenAPI (/api/docs)", () => {
  it("serve a especificação em JSON para Postman/Insomnia", async () => {
    const response = await request(app).get("/api/docs/openapi.json");

    expect(response.status).toBe(200);
    expect(response.body.openapi).toMatch(/^3\./);
  });

  it("serve a interface do Swagger UI", async () => {
    const response = await request(app).get("/api/docs/").redirects(1);

    expect(response.status).toBe(200);
    expect(response.text).toContain("swagger-ui");
  });

  it("documenta todas as rotas da API", async () => {
    const { body: spec } = await request(app).get("/api/docs/openapi.json");
    const documented = new Set(
      Object.entries(spec.paths as Record<string, Record<string, unknown>>).flatMap(([path, ops]) =>
        Object.keys(ops).map((method) => `${method.toUpperCase()} ${path}`)
      )
    );

    const registered = listRoutes();
    expect(registered.length).toBeGreaterThan(10);

    const missing = registered
      .map((route) => {
        const [method, path] = route.split(" ");
        return `${method} ${toOpenApiPath(path)}`;
      })
      .filter((route) => !documented.has(route));

    expect(missing).toEqual([]);
  });
});
