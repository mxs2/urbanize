import fs from "fs";
import path from "path";
import request from "supertest";
import { app } from "../../backend/src/app";
import { env } from "../../backend/src/config/env";
import { getCidadaoSession } from "./helpers/authHelper";
import { testDb } from "./helpers/testDb";

// O multer só confere o mimetype; bastam os marcadores de início e fim de um JPEG.
const FOTO = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

describe("SUT API Tests - Upload de imagem e triagem (/api/upload, /api/demands)", () => {
  let cidadaoToken: string;
  const credenciaisOriginais = env.googleCredentials;
  const arquivosGravados: string[] = [];

  const enviarFoto = (categoria?: string) => {
    const req = request(app).post("/api/upload/image").set("Authorization", `Bearer ${cidadaoToken}`);
    if (categoria) req.field("categoria", categoria);
    return req.attach("imagem", FOTO, { filename: "foto.jpg", contentType: "image/jpeg" });
  };

  const guardarArquivo = (imageUrl: string) => arquivosGravados.push(path.join(UPLOAD_DIR, path.basename(imageUrl)));

  beforeAll(async () => {
    cidadaoToken = (await getCidadaoSession()).token;
  });

  afterEach(() => {
    env.googleCredentials = credenciaisOriginais;
  });

  afterAll(async () => {
    arquivosGravados.forEach((arquivo) => fs.rmSync(arquivo, { force: true }));
    await testDb.cleanTestData();
    await testDb.disconnect();
  });

  describe("POST /api/upload/image - Upload", () => {
    it("TC46: Deve receber a URL da imagem ao enviar arquivo válido", async () => {
      env.googleCredentials = null;
      const response = await enviarFoto("vias_publicas");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.imageUrl).toMatch(/^\/uploads\//);
      guardarArquivo(response.body.data.imageUrl);
      expect(fs.existsSync(arquivosGravados[arquivosGravados.length - 1])).toBe(true);
    });

    it("TC47: Deve recusar upload sem arquivo e retornar status 400", async () => {
      const antes = fs.readdirSync(UPLOAD_DIR).length;

      const response = await request(app)
        .post("/api/upload/image")
        .set("Authorization", `Bearer ${cidadaoToken}`)
        .field("categoria", "vias_publicas");

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("NO_FILE");
      expect(fs.readdirSync(UPLOAD_DIR).length).toBe(antes);
    });

    it("TC48: Deve recusar upload sem autenticação e retornar status 401", async () => {
      const antes = fs.readdirSync(UPLOAD_DIR).length;

      const response = await request(app)
        .post("/api/upload/image")
        .attach("imagem", FOTO, { filename: "foto.jpg", contentType: "image/jpeg" });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("UNAUTHENTICATED");
      expect(fs.readdirSync(UPLOAD_DIR).length).toBe(antes);
    });
  });

  describe("POST /api/upload/image - Fallback do Google Vision", () => {
    it("TC49: Deve usar a categoria enviada pelo frontend quando o Google Vision não está configurado", async () => {
      env.googleCredentials = null;
      const response = await enviarFoto("zeladoria");

      expect(response.status).toBe(200);
      expect(response.body.data.triagem.categoria).toBe("zeladoria");
      guardarArquivo(response.body.data.imageUrl);
    });

    it("TC50: Deve usar a categoria enviada quando o Google Vision configurado falha", async () => {
      env.googleCredentials = "credencial-invalida";
      const response = await enviarFoto("saneamento");

      expect(response.status).toBe(200);
      expect(response.body.data.triagem.categoria).toBe("saneamento");
      guardarArquivo(response.body.data.imageUrl);

      const health = await request(app).get("/api/health");
      expect(health.status).toBe(200);
      expect(health.body.data.status).toBe("ok");
    });
  });

  describe("POST /api/demands - Sugestão de encaminhamento", () => {
    it("TC83: Deve sugerir o órgão cujo categoriasJson contém a categoria da demanda", async () => {
      const organs = await request(app).get("/api/organs").set("Authorization", `Bearer ${cidadaoToken}`);
      const orgaoDeVias = organs.body.data.filter((o: { categoriasJson: string }) =>
        (JSON.parse(o.categoriasJson) as string[]).includes("vias_publicas")
      );
      expect(orgaoDeVias).toHaveLength(1);

      const response = await request(app)
        .post("/api/demands")
        .set("Authorization", `Bearer ${cidadaoToken}`)
        .send({
          titulo: "Buraco na via",
          descricao: "Buraco grande no meio da rua, perigo para motos.",
          categoria: "vias_publicas",
          endereco: { endereco: "Rua Exemplo, 100" },
        });

      expect(response.status).toBe(201);
      expect(response.body.data.sugestaoEncaminhamento).toBe(orgaoDeVias[0].nome);
    });
  });
});
