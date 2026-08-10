import assert from "node:assert/strict";
import { Given, When, Then } from "@cucumber/cucumber";
import request from "supertest";
import { app } from "../../../backend/src/app";

let response: request.Response;

interface CustomWorld {
  email: string;
  senha: string;
}

Given(
  "que eu tenho um email {string} e senha {string}",
  function (this: CustomWorld, email: string, senha: string) {
    this.email = email;
    this.senha = senha;
  }
);

When(
  "eu envio uma requisição de login",
  async function (this: CustomWorld) {
    response = await request(app).post("/api/auth/login").send({
      email: this.email,
      senha: this.senha,
    });
  }
);

Then("eu devo receber um token de autenticação", function () {
  assert.strictEqual(response.status, 200);
  assert.notStrictEqual(response.body.data.token, undefined);
});

Then(
  "eu devo receber uma mensagem de erro {string}",
  function (message: string) {
    assert.strictEqual(response.status, 401);
    assert.strictEqual(response.body.error.message, message);
  }
);