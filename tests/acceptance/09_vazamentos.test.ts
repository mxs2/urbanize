import request from "supertest";
import { app } from "../../backend/src/app";

describe("SUT API Tests - Dados sensíveis em log", () => {
  it("TC134: JSON malformado deve responder 400 sem registrar o corpo no log", async () => {
    const log = jest.spyOn(console, "error").mockImplementation(() => undefined);

    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email":"a@urbanize.test","senha":"segredo-do-teste",}');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_BODY");
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });
});
