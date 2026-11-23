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

  describe("GET /uploads - Acesso às fotos (RS10)", () => {
    const criarDemandaComFoto = async () => {
      const upload = await enviarFoto("vias_publicas");
      guardarArquivo(upload.body.data.imageUrl);
      const demanda = await request(app)
        .post("/api/demands")
        .set("Authorization", `Bearer ${cidadaoToken}`)
        .send({
          titulo: "Buraco com foto",
          descricao: "Buraco grande no meio da rua, perigo para motos.",
          categoria: "vias_publicas",
          endereco: { endereco: "Rua Exemplo, 100" },
          imagemUrl: upload.body.data.imageUrl,
        });
      return { upload: upload.body.data.imageUrl as string, demanda };
    };

    it("TC95: Deve recusar a foto sem link assinado e retornar status 403", async () => {
      env.googleCredentials = null;
      const { upload } = await criarDemandaComFoto();

      const response = await request(app).get(upload);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe("INVALID_UPLOAD_LINK");
    });

    it("TC96: Deve devolver a foto pelo link assinado presente na demanda", async () => {
      env.googleCredentials = null;
      const { demanda } = await criarDemandaComFoto();

      expect(demanda.status).toBe(201);
      expect(demanda.body.data.imagemUrl).toMatch(/^\/uploads\/[^?]+\?expires=\d+&signature=[0-9a-f]{64}$/);

      const response = await request(app).get(demanda.body.data.imagemUrl);
      expect(response.status).toBe(200);
      expect(response.headers["x-content-type-options"]).toBe("nosniff");
    });

    it("TC97: Deve recusar link com assinatura adulterada ou de outro arquivo", async () => {
      env.googleCredentials = null;
      const { demanda, upload } = await criarDemandaComFoto();
      const link = demanda.body.data.imagemUrl as string;

      const adulterada = link.replace(/signature=./, "signature=0");
      expect((await request(app).get(adulterada)).status).toBe(403);

      const outroArquivo = link.replace(path.basename(upload), "outra-foto.jpg");
      expect((await request(app).get(outroArquivo)).status).toBe(403);
    });

    it("TC98: Deve recusar link expirado", async () => {
      env.googleCredentials = null;
      const { demanda } = await criarDemandaComFoto();
      jest.useFakeTimers({ now: Date.now() + (env.uploadUrlTtlSeconds + 60) * 1000, doNotFake: ["nextTick", "setImmediate", "setTimeout"] });
      try {
        const response = await request(app).get(demanda.body.data.imagemUrl);
        expect(response.status).toBe(403);
      } finally {
        jest.useRealTimers();
      }
    });

    it("TC99: Deve recusar path traversal em /uploads", async () => {
      const response = await request(app).get("/uploads/..%2f..%2fpackage.json?expires=9999999999&signature=x");
      expect([403, 404]).toContain(response.status);
    });

    it("TC104: Deve responder 404 (e não 500) a nome de arquivo com escape malformado", async () => {
      const response = await request(app).get("/uploads/%E0%A4%A");
      expect(response.status).toBe(404);
    });

    it("TC100: Deve gravar apenas o caminho, sem a assinatura, e recusar imagemUrl fora de /uploads", async () => {
      env.googleCredentials = null;
      const { demanda } = await criarDemandaComFoto();
      const reenviada = await request(app)
        .post("/api/demands")
        .set("Authorization", `Bearer ${cidadaoToken}`)
        .send({
          titulo: "Reenvio",
          descricao: "Reenviando o link assinado devolvido pela API.",
          categoria: "vias_publicas",
          endereco: { endereco: "Rua Exemplo, 100" },
          imagemUrl: demanda.body.data.imagemUrl,
        });
      expect(reenviada.status).toBe(201);
      expect(reenviada.body.data.imagemUrl).toMatch(/^\/uploads\/[^?]+\?expires=/);

      const invalida = await request(app)
        .post("/api/demands")
        .set("Authorization", `Bearer ${cidadaoToken}`)
        .send({
          titulo: "Externa",
          descricao: "Tentando apontar para uma URL de fora.",
          categoria: "vias_publicas",
          endereco: { endereco: "Rua Exemplo, 100" },
          imagemUrl: "http://exemplo.com/foto.jpg",
        });
      expect(invalida.status).toBe(422);
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
