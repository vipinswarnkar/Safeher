import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

// These tests never reach the database: they check the layers in front of it
// (validation, auth, routing, error handling).
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
const { default: app } = await import("../app.js");

test("GET /api/health responds ok", async () => {
  const res = await request(app).get("/api/health");
  assert.equal(res.status, 200);
  assert.equal(res.body.status, "ok");
});

test("unknown routes return JSON 404", async () => {
  const res = await request(app).get("/api/does-not-exist");
  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
});

test("register rejects invalid input with field errors", async () => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: "", email: "not-an-email", password: "123", phone: "12" });
  assert.equal(res.status, 400);
  const fields = res.body.errors.map((e) => e.field);
  for (const f of ["body.name", "body.email", "body.password", "body.phone"]) {
    assert.ok(fields.includes(f), `missing ${f}`);
  }
});

test("login requires a valid email", async () => {
  const res = await request(app).post("/api/auth/login").send({ email: "x", password: "y" });
  assert.equal(res.status, 400);
  assert.equal(res.body.message, "Enter a valid email");
});

test("malformed JSON gives 400, not 500", async () => {
  const res = await request(app)
    .post("/api/auth/login")
    .set("Content-Type", "application/json")
    .send('{"email": ');
  assert.equal(res.status, 400);
});

test("protected routes need a token", async () => {
  for (const url of ["/api/contacts", "/api/safety/score?lat=19&lng=72", "/api/reports/mine"]) {
    const res = await request(app).get(url);
    assert.equal(res.status, 401, url);
  }
});

test("invalid token is rejected", async () => {
  const res = await request(app).get("/api/contacts").set("Authorization", "Bearer nonsense");
  assert.equal(res.status, 401);
});

test("tracking link with a malformed token is a 404", async () => {
  const res = await request(app).get("/api/track/short");
  assert.equal(res.status, 404);
});

test("security headers are set", async () => {
  const res = await request(app).get("/api/health");
  assert.equal(res.headers["x-content-type-options"], "nosniff");
});
