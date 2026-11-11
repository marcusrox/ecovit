import {
  beforeAll,
  beforeEach,
  afterAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { randomUUID, randomFillSync } from "node:crypto";
import { readFile, mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { PassThrough } from "node:stream";
import { database, migrate } from "../../server/db";
import { readConfig } from "../../server/config";
import { createApi } from "../../server/app";
import { cleanup } from "../../server/cleanup";
import { hash } from "../../server/security";
import { assetPath } from "../../server/projects";
import { createProject, makeWall } from "../../src/domain/project";
import { dehydrate } from "../../src/persistence/remote-document";
import { generate } from "../../src/domain/composition";
import { validateTestDatabaseUrl } from "../../scripts/load-test-env";

const databaseUrl = validateTestDatabaseUrl(process.env.M12_TEST_DATABASE_URL);
const root = path.resolve(".tools/m12/integration");
const config = readConfig({
  NODE_ENV: "test",
  DATABASE_URL: databaseUrl,
  SESSION_SECRET: "test-only-secret-with-over-thirty-two-characters",
  APP_ORIGIN: "http://127.0.0.1:5174",
  DATA_DIR: path.join(root, "assets"),
  MAIL_CAPTURE_DIR: path.join(root, "mail"),
});
const db = database(config.databaseUrl);
const app = await createApi(db, config);
type User = { cookie: string; csrf: string; id: string; email: string };
function cookies(response: { headers: { [key: string]: unknown } }) {
  const set = response.headers["set-cookie"];
  return (Array.isArray(set) ? set : set ? [String(set)] : [])
    .map((value) => value.split(";")[0])
    .join("; ");
}
const body = (revision?: string) => ({
  operationId: randomUUID(),
  requestIssuedAt: new Date().toISOString(),
  ...(revision ? { expectedRevision: revision } : {}),
});
function headers(user: User) {
  return {
    cookie: user.cookie,
    origin: config.origin,
    "x-csrf-token": user.csrf,
  };
}
async function login(email: string): Promise<User> {
  const session = await app.inject({ url: "/api/session" });
  const flow = cookies(session);
  const code = await app.inject({
    method: "POST",
    url: "/api/auth/code",
    headers: {
      cookie: flow,
      origin: config.origin,
      "x-csrf-token": session.json().csrf,
    },
    payload: { email, purpose: "login" },
  });
  expect(code.statusCode).toBe(200);
  const captured = JSON.parse(
    await readFile(
      path.join(config.mailCapture!, `${code.json().id}.json`),
      "utf8",
    ),
  );
  const verified = await app.inject({
    method: "POST",
    url: "/api/auth/verify",
    headers: {
      cookie: flow,
      origin: config.origin,
      "x-csrf-token": session.json().csrf,
    },
    payload: { id: captured.id, code: captured.code },
  });
  expect(verified.statusCode).toBe(200);
  return {
    cookie: `${flow}; ${cookies(verified)}`,
    csrf: verified.json().csrf,
    ...verified.json().account,
  };
}
async function create(user: User, name = "Projeto remoto") {
  const doc = createProject(name, { length: 2500, width: 1250, height: 700 });
  const input = { ...body(), doc: dehydrate(doc, {}) };
  const response = await app.inject({
    method: "POST",
    url: `/api/projects/${doc.project.id}`,
    headers: headers(user),
    payload: input,
  });
  expect(response.statusCode, response.body).toBe(200);
  return { doc, input, result: response.json() };
}
beforeAll(async () => {
  await migrate(db);
  await app.ready();
});
beforeEach(async () => {
  await db.query(
    "TRUNCATE ecovit_accounts,ecovit_challenges,ecovit_deletions,ecovit_rate_limits CASCADE",
  );
});
afterAll(async () => {
  await app.close();
  await db.end();
});

describe("M12 — API com PostgreSQL 18.0 real", () => {
  it("exige origem/CSRF para código, limita tentativas sem rollback do contador e consome código uma única vez", async () => {
    const initial = await app.inject({ url: "/api/session" });
    const common = {
      cookie: cookies(initial),
      origin: config.origin,
      "x-csrf-token": initial.json().csrf,
    };
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/auth/code",
          payload: { email: "a@example.com", purpose: "login" },
        })
      ).statusCode,
    ).toBe(403);
    const requested = await app.inject({
      method: "POST",
      url: "/api/auth/code",
      headers: common,
      payload: { email: "a@example.com", purpose: "login" },
    });
    expect(requested.statusCode).toBe(200);
    const capture = JSON.parse(
      await readFile(
        path.join(config.mailCapture!, `${requested.json().id}.json`),
        "utf8",
      ),
    );
    const wrong = capture.code === "000000" ? "000001" : "000000";
    for (let i = 0; i < 5; i++)
      expect(
        (
          await app.inject({
            method: "POST",
            url: "/api/auth/verify",
            headers: common,
            payload: { id: capture.id, code: wrong },
          })
        ).statusCode,
      ).toBe(422);
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/auth/verify",
          headers: common,
          payload: { id: capture.id, code: capture.code },
        })
      ).statusCode,
    ).toBe(422);
    expect(
      (
        await db.query("SELECT attempts FROM ecovit_challenges WHERE id=$1", [
          capture.id,
        ])
      ).rows[0].attempts,
    ).toBe(5);
    expect(
      (await db.query("SELECT count(*)::int AS count FROM ecovit_accounts"))
        .rows[0].count,
    ).toBe(0);
  });
  it("reutiliza a conta com e-mail normalizado e revoga sessão ao sair", async () => {
    const first = await login("User@EXAMPLE.COM"),
      second = await login("user@example.com");
    expect(first.id).toBe(second.id);
    const logout = await app.inject({
      method: "POST",
      url: "/api/logout",
      headers: headers(first),
    });
    expect(logout.statusCode).toBe(200);
    expect(
      (await app.inject({ url: "/api/projects", headers: headers(first) }))
        .statusCode,
    ).toBe(401);
    expect(
      (await app.inject({ url: "/api/projects", headers: headers(second) }))
        .statusCode,
    ).toBe(200);
  });
  it("isola projeto, recibo e escrita por proprietário; UUID/cabeçalho não concedem acesso", async () => {
    const a = await login("a@example.com"),
      b = await login("b@example.com");
    const project = await create(a);
    expect(
      (
        await app.inject({
          url: `/api/projects/${project.doc.project.id}`,
          headers: headers(b),
        })
      ).statusCode,
    ).toBe(404);
    expect(
      (
        await app.inject({
          url: `/api/operations/${project.input.operationId}`,
          headers: headers(b),
        })
      ).statusCode,
    ).toBe(404);
    expect(
      (
        await app.inject({
          url: "/api/projects",
          headers: { ...headers(b), "x-ecovit-account": a.id },
        })
      ).statusCode,
    ).toBe(409);
    expect(
      (
        await app.inject({
          method: "PUT",
          url: `/api/projects/${project.doc.project.id}`,
          headers: headers(b),
          payload: { ...body("1"), doc: dehydrate(project.doc, {}) },
        })
      ).statusCode,
    ).toBe(404);
    expect(
      (
        await app.inject({
          method: "PUT",
          url: `/api/projects/${project.doc.project.id}`,
          headers: { ...headers(a), "x-csrf-token": "wrong" },
          payload: {},
        })
      ).statusCode,
    ).toBe(403);
  });
  it("grava uma vez por operationId e conserva JSON com Unicode escapado e texto SQL/HTML inofensivo", async () => {
    const user = await login("a@example.com");
    const name = "<script>x</script>'); DROP TABLE ecovit_accounts;--\u0000";
    const project = await create(user, name);
    const again = await app.inject({
      method: "POST",
      url: `/api/projects/${project.doc.project.id}`,
      headers: headers(user),
      payload: project.input,
    });
    expect(again.statusCode).toBe(200);
    expect(again.json().revision).toBe("1");
    const changed = structuredClone(project.input);
    changed.doc.project.name = "Outro";
    expect(
      (
        await app.inject({
          method: "POST",
          url: `/api/projects/${project.doc.project.id}`,
          headers: headers(user),
          payload: changed,
        })
      ).statusCode,
    ).toBe(409);
    const stored = await app.inject({
      url: `/api/projects/${project.doc.project.id}`,
      headers: headers(user),
    });
    expect(stored.json().doc.project.name).toBe(name);
    expect(stored.json().doc.generated).toBeNull();
    expect(
      (await db.query("SELECT count(*)::int AS count FROM ecovit_accounts"))
        .rows[0].count,
    ).toBe(1);
  });
  it("arbitra corrida de revisão e conserva intenção vencedora", async () => {
    const user = await login("a@example.com"),
      project = await create(user);
    const send = (name: string) =>
      app.inject({
        method: "PUT",
        url: `/api/projects/${project.doc.project.id}`,
        headers: headers(user),
        payload: {
          ...body("1"),
          doc: {
            ...dehydrate(project.doc, {}),
            project: { ...project.doc.project, name },
          },
        },
      });
    const responses = await Promise.all([send("A"), send("B")]);
    expect(responses.map((result) => result.statusCode).sort()).toEqual([
      200, 409,
    ]);
    const stored = await app.inject({
      url: `/api/projects/${project.doc.project.id}`,
      headers: headers(user),
    });
    expect(stored.json().revision).toBe("2");
    expect(stored.json().doc.project.name).toBe(
      responses[0].statusCode === 200 ? "A" : "B",
    );
  });
  it("recusa pedido atrasado, adulteração de snapshot e campos de proprietário", async () => {
    const user = await login("a@example.com"),
      project = await create(user);
    const doc = dehydrate(project.doc, {});
    const expired = await app.inject({
      method: "PUT",
      url: `/api/projects/${project.doc.project.id}`,
      headers: headers(user),
      payload: {
        ...body("1"),
        requestIssuedAt: new Date(Date.now() - 25 * 3600000).toISOString(),
        doc,
      },
    });
    expect(expired.statusCode).toBe(409);
    expect(
      (
        await app.inject({
          method: "PUT",
          url: `/api/projects/${project.doc.project.id}`,
          headers: headers(user),
          payload: { ...body("1"), doc, ownerId: user.id },
        })
      ).statusCode,
    ).toBe(422);
    const source = structuredClone(project.doc);
    source.model.walls.push(
      makeWall(
        { x: 0, y: 0 },
        { x: 10000, y: 0 },
        1250,
        source.model.floors[0].id,
        28000,
        1,
      )!,
    );
    source.generated = generate(source);
    source.generationState = {
      status: "current",
      diagnostics: source.generated.diagnostics,
    };
    source.generated.floors[0].courses[0].pieces[0].x += 1;
    const input = dehydrate(source, {});
    const corrupt = await app.inject({
      method: "POST",
      url: `/api/projects/${source.project.id}`,
      headers: headers(user),
      payload: { ...body(), doc: input, sourceFile: JSON.stringify(source) },
    });
    expect(corrupt.statusCode).toBe(422);
    expect(
      (await db.query("SELECT count(*)::int AS count FROM ecovit_projects"))
        .rows[0].count,
    ).toBe(1);
  });
  it("cotas de projetos são atômicas e lixeira preserva/restaura com revisão crescente", async () => {
    const user = await login("a@example.com"),
      project = await create(user);
    const oldLimit = config.projectLimit;
    config.projectLimit = 1;
    try {
      const other = createProject("Outro", {
        length: 2500,
        width: 1250,
        height: 700,
      });
      expect(
        (
          await app.inject({
            method: "POST",
            url: `/api/projects/${other.project.id}`,
            headers: headers(user),
            payload: { ...body(), doc: dehydrate(other, {}) },
          })
        ).statusCode,
      ).toBe(422);
      const trash = await app.inject({
        method: "POST",
        url: `/api/projects/${project.doc.project.id}/trash`,
        headers: headers(user),
        payload: body("1"),
      });
      expect(trash.statusCode).toBe(200);
      expect(
        (
          await app.inject({
            method: "PUT",
            url: `/api/projects/${project.doc.project.id}`,
            headers: headers(user),
            payload: { ...body("1"), doc: dehydrate(project.doc, {}) },
          })
        ).statusCode,
      ).toBe(409);
      const listing = await app.inject({
        url: "/api/projects",
        headers: headers(user),
      });
      expect(listing.json().usage.projects).toBe(1);
      expect(listing.json().projects[0].state).toBe("trashed");
      const restored = await app.inject({
        method: "POST",
        url: `/api/projects/${project.doc.project.id}/restore`,
        headers: headers(user),
        payload: body("2"),
      });
      expect(restored.json().revision).toBe("3");
    } finally {
      config.projectLimit = oldLimit;
    }
  });
  it("valida imagem real, não duplica reserva, bloqueia acesso externo e limpa temporário", async () => {
    const user = await login("a@example.com"),
      other = await login("b@example.com");
    const doc = createProject("Imagem", {
      length: 2500,
      width: 1250,
      height: 700,
    });
    const bytes = await sharp({
      create: { width: 2, height: 2, channels: 4, background: "green" },
    })
      .png()
      .toBuffer();
    const id = randomUUID().toUpperCase();
    const send = (payload: Buffer) =>
      app.inject({
        method: "POST",
        url: `/api/uploads/${doc.project.id}/${id}`,
        headers: {
          ...headers(user),
          "content-type": "application/octet-stream",
        },
        payload,
      });
    expect((await send(bytes)).statusCode).toBe(200);
    expect((await send(bytes)).statusCode).toBe(200);
    expect((await send(Buffer.from("bad"))).statusCode).toBe(409);
    expect(
      (
        await db.query(
          "SELECT sum(bytes)::int AS bytes FROM ecovit_assets WHERE owner_id=$1",
          [user.id],
        )
      ).rows[0].bytes,
    ).toBe(bytes.length);
    doc.model.customImageAssets.push({
      id: randomUUID(),
      name: "PNG",
      mime: "image/png",
      data: bytes.toString("base64"),
      width: 2,
      height: 2,
    });
    const remote = dehydrate(doc, {
      [`custom:${doc.model.customImageAssets[0].id}`]: id,
    });
    const saved = await app.inject({
      method: "POST",
      url: `/api/projects/${doc.project.id}`,
      headers: headers(user),
      payload: { ...body(), doc: remote },
    });
    expect(saved.statusCode, saved.body).toBe(200);
    const canonicalResource = await app.inject({
      url: `/api/projects/${doc.project.id}`,
      headers: headers(user),
    });
    expect(
      canonicalResource.json().doc.model.customImageAssets[0].resourceId,
    ).toBe(id.toLowerCase());
    expect(
      (
        await app.inject({
          url: `/api/images/${doc.project.id}/${id}`,
          headers: headers(other),
        })
      ).statusCode,
    ).toBe(404);
    const image = await app.inject({
      url: `/api/images/${doc.project.id}/${id}`,
      headers: headers(user),
    });
    expect(image.rawPayload.equals(bytes)).toBe(true);
    const malformed = await app.inject({
      method: "POST",
      url: `/api/uploads/${doc.project.id}/${randomUUID()}`,
      headers: { ...headers(user), "content-type": "application/octet-stream" },
      payload: Buffer.from("<html>not a png</html>"),
    });
    expect(malformed.statusCode).toBe(422);
    const orphan = randomUUID();
    await mkdir(config.dataDir, { recursive: true });
    await db.query(
      "INSERT INTO ecovit_assets(id,owner_id,project_id,bytes,hash,created_at) VALUES($1,$2,$3,5,$4,clock_timestamp()-interval '25 hours')",
      [orphan, user.id, doc.project.id, hash("bytes")],
    );
    await cleanup(db, config);
    expect(
      (await db.query("SELECT 1 FROM ecovit_assets WHERE id=$1", [orphan]))
        .rowCount,
    ).toBe(0);
    expect(
      (
        await app.inject({
          url: `/api/images/${doc.project.id}/${id}`,
          headers: headers(user),
        })
      ).statusCode,
    ).toBe(200);
  });
  it("exclusão exige código específico, revoga todas as sessões e fornece recibo restrito", async () => {
    const user = await login("a@example.com"),
      second = await login("a@example.com");
    await create(user);
    await db.query(
      "UPDATE ecovit_rate_limits SET expires_at=clock_timestamp()-interval '1 second' WHERE key LIKE 'mail-cooldown:%'",
    );
    const requested = await app.inject({
      method: "POST",
      url: "/api/auth/code",
      headers: headers(user),
      payload: { email: user.email, purpose: "delete" },
    });
    expect(requested.statusCode).toBe(200);
    const capture = JSON.parse(
      await readFile(
        path.join(config.mailCapture!, `${requested.json().id}.json`),
        "utf8",
      ),
    );
    const verified = await app.inject({
      method: "POST",
      url: "/api/auth/verify",
      headers: headers(user),
      payload: { id: capture.id, code: capture.code },
    });
    expect(verified.statusCode).toBe(200);
    const deletion = verified.json().deletion;
    const orphanPath = assetPath(config, randomUUID(), user.id);
    await writeFile(orphanPath, Buffer.from("interrupted private copy"));
    const deleted = await app.inject({
      method: "POST",
      url: "/api/account/delete",
      headers: headers(user),
      payload: deletion,
    });
    expect(deleted.statusCode).toBe(200);
    expect(
      (await app.inject({ url: "/api/projects", headers: headers(second) }))
        .statusCode,
    ).toBe(401);
    const receipt = () =>
      app.inject({
        method: "POST",
        url: "/api/account/deletion-receipt",
        headers: { origin: config.origin },
        payload: { receipt: deletion.receipt },
      });
    expect((await receipt()).json()).toEqual({
      accepted: true,
      completed: false,
    });
    await cleanup(db, config);
    await expect(access(orphanPath)).rejects.toMatchObject({ code: "ENOENT" });
    expect((await receipt()).json()).toEqual({
      accepted: true,
      completed: true,
    });
    expect(
      (await db.query("SELECT count(*)::int AS count FROM ecovit_accounts"))
        .rows[0].count,
    ).toBe(0);
    expect(
      (await db.query("SELECT count(*)::int AS count FROM ecovit_projects"))
        .rows[0].count,
    ).toBe(0);
  });
  it("login local usa apenas a conta configurada e isola a sessão", async () => {
    const owner = await login("local@example.com");
    await create(owner);
    const environment = {
      NODE_ENV: "development",
      DATABASE_URL: config.databaseUrl,
      SESSION_SECRET: config.secret,
      APP_ORIGIN: config.origin,
      DATA_DIR: config.dataDir,
      DEV_LOGIN_EMAIL: " LOCAL@EXAMPLE.COM ",
      RESEND_API_KEY: "isolated-test-key-no-mail-sent",
      MAIL_FROM: "Ecovit <ecovit@example.com>",
    };
    expect(() =>
      readConfig({ ...environment, APP_ORIGIN: "https://ecovit.example" }),
    ).toThrow("DEV_LOGIN_EMAIL");
    const localConfig = readConfig(environment);
    const service = await createApi(db, localConfig);
    try {
      const host = new URL(config.origin).host;
      const flow = await service.inject({
        url: "/api/session",
        headers: { host, cookie: owner.cookie },
      });
      expect(flow.json()).toMatchObject({ account: null, devLogin: true });
      const request = {
        method: "POST" as const,
        url: "/api/auth/dev-login",
        headers: {
          host,
          cookie: cookies(flow),
          origin: config.origin,
          "x-csrf-token": flow.json().csrf,
        },
      };
      for (const headers of [
        { ...request.headers, origin: "http://other.example" },
        { ...request.headers, host: "other.example" },
        { ...request.headers, "x-forwarded-for": "192.0.2.1" },
        { ...request.headers, "x-csrf-token": "wrong" },
      ]) {
        expect((await service.inject({ ...request, headers })).statusCode).toBe(
          403,
        );
      }
      const signedIn = await service.inject(request);
      expect(signedIn.statusCode).toBe(200);
      expect(signedIn.json().account).toEqual({
        id: owner.id,
        email: owner.email,
      });
      const sessionCookie = cookies(signedIn);
      const list = await service.inject({
        url: "/api/projects",
        headers: { host, cookie: sessionCookie },
      });
      expect(list.json().projects).toHaveLength(1);
      const normal = await app.inject({
        url: "/api/session",
        headers: { cookie: sessionCookie.replace("ecovit-dev=", "ecovit=") },
      });
      expect(normal.json()).toMatchObject({ account: null });
      expect(normal.json()).not.toHaveProperty("devLogin");
      expect((await app.inject(request)).statusCode).toBe(404);
      const logout = await service.inject({
        method: "POST",
        url: "/api/logout",
        headers: {
          ...request.headers,
          cookie: sessionCookie,
          "x-csrf-token": signedIn.json().csrf,
        },
      });
      expect(logout.statusCode).toBe(200);
      const afterLogout = await service.inject({
        url: "/api/session",
        headers: { host, cookie: sessionCookie },
      });
      expect(afterLogout.json()).toMatchObject({
        account: null,
        devLogin: true,
      });
    } finally {
      await service.close();
    }
  });
  it("produção recusa captura e aplica cookies, headers e origem seguros", async () => {
    expect(() =>
      readConfig({
        NODE_ENV: "production",
        DATABASE_URL: config.databaseUrl,
        SESSION_SECRET: config.secret,
        APP_ORIGIN: "https://ecovit.example",
        MAIL_CAPTURE_DIR: root,
      }),
    ).toThrow("RESEND_API_KEY");
    const production = readConfig({
      NODE_ENV: "production",
      DATABASE_URL: config.databaseUrl,
      SESSION_SECRET: config.secret,
      APP_ORIGIN: "https://ecovit.example",
      DATA_DIR: path.join(root, "production-assets"),
      RESEND_API_KEY: "isolated-test-key-no-mail-sent",
      MAIL_FROM: "Ecovit <ecovit@example.com>",
      DEV_LOGIN_EMAIL: "ignored@example.com",
    });
    const service = await createApi(db, production);
    try {
      const session = await service.inject({ url: "/api/session" });
      expect(session.json()).not.toHaveProperty("devLogin");
      expect(
        (await service.inject({ method: "POST", url: "/api/auth/dev-login" }))
          .statusCode,
      ).toBe(404);
      const header = String(session.headers["set-cookie"]);
      expect(header).toMatch(/^__Host-ecovit-flow=/);
      expect(header).toContain("; Path=/");
      expect(header).toContain("; HttpOnly");
      expect(header).toContain("; Secure");
      expect(header).toContain("; SameSite=Lax");
      expect(header).not.toContain("Domain=");
      expect(session.headers["cache-control"]).toBe("no-store");
      expect(session.headers["x-content-type-options"]).toBe("nosniff");
      expect(session.headers["referrer-policy"]).toBe("no-referrer");
      expect(session.headers["content-security-policy"]).toContain(
        "frame-ancestors 'none'",
      );
      const refused = await service.inject({
        method: "POST",
        url: "/api/auth/code",
        headers: {
          cookie: cookies(session),
          "x-csrf-token": session.json().csrf,
          origin: "http://ecovit.example",
        },
        payload: { email: "nobody@example.com", purpose: "login" },
      });
      expect(refused.statusCode).toBe(403);
      expect(refused.json().code).toBe("origin");
    } finally {
      await service.close();
    }
  });
  it("reconecta após queda de conexão ociosa sem encerrar a API", async () => {
    const client = await db.connect();
    const pid = (await client.query("SELECT pg_backend_pid() AS pid")).rows[0]
      .pid;
    client.release();
    const administrator = database(config.databaseUrl);
    const evicted = new Promise<void>((resolve) =>
      db.once("error", () => resolve()),
    );
    try {
      await administrator.query("SELECT pg_terminate_backend($1)", [pid]);
      await evicted;
      expect((await app.inject({ url: "/api/health" })).statusCode).toBe(200);
    } finally {
      await administrator.end();
    }
  });
  it("recusa excesso antes de ler corpos grandes e libera admissão após conclusão/erro", async () => {
    const user = await login("a@example.com");
    const service = await createApi(db, config);
    let parsing = 0;
    service.addHook("preParsing", async (request, _reply, payload) => {
      if (request.headers["x-held-body"]) parsing++;
      return payload;
    });
    const firstDoc = createProject("Corpo 1", {
        length: 2500,
        width: 1250,
        height: 700,
      }),
      secondDoc = createProject("Corpo 2", {
        length: 2500,
        width: 1250,
        height: 700,
      });
    const first = new PassThrough(),
      second = new PassThrough();
    const start = (doc: typeof firstDoc, stream: PassThrough) =>
      service.inject({
        method: "POST",
        url: `/api/projects/${doc.project.id}`,
        headers: {
          ...headers(user),
          "content-type": "application/json",
          "x-held-body": "yes",
        },
        payload: stream,
      });
    const requests = [start(firstDoc, first), start(secondDoc, second)];
    try {
      await expect.poll(() => parsing).toBe(2);
      const rejected = await service.inject({
        method: "POST",
        url: `/api/projects/${randomUUID()}`,
        headers: { ...headers(user), "content-type": "application/json" },
        payload: "{",
      });
      expect(rejected.statusCode).toBe(429);
      expect(rejected.json().code).toBe("server_busy");
      expect(parsing).toBe(2);
    } finally {
      first.end(JSON.stringify({ ...body(), doc: dehydrate(firstDoc, {}) }));
      second.end(JSON.stringify({ ...body(), doc: dehydrate(secondDoc, {}) }));
      await Promise.allSettled(requests);
    }
    try {
      const malformed = await service.inject({
        method: "POST",
        url: `/api/projects/${randomUUID()}`,
        headers: { ...headers(user), "content-type": "application/json" },
        payload: "{",
      });
      expect(malformed.statusCode).toBe(400);
      const doc = createProject("Admissão liberada", {
        length: 2500,
        width: 1250,
        height: 700,
      });
      const accepted = await service.inject({
        method: "POST",
        url: `/api/projects/${doc.project.id}`,
        headers: headers(user),
        payload: { ...body(), doc: dehydrate(doc, {}) },
      });
      expect(accepted.statusCode, accepted.body).toBe(200);
    } finally {
      await service.close();
    }
  });
  it("escopo de outra conta não encerra sessão nem autoriza código/exclusão", async () => {
    const user = await login("a@example.com"),
      scope = { ...headers(user), "x-ecovit-account": randomUUID() };
    expect(
      (await app.inject({ method: "POST", url: "/api/logout", headers: scope }))
        .statusCode,
    ).toBe(409);
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/auth/code",
          headers: scope,
          payload: { email: user.email, purpose: "delete" },
        })
      ).statusCode,
    ).toBe(409);
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/account/delete",
          headers: scope,
          payload: { proof: "a".repeat(43), receipt: "b".repeat(43) },
        })
      ).statusCode,
    ).toBe(409);
    expect(
      (await app.inject({ url: "/api/projects", headers: headers(user) }))
        .statusCode,
    ).toBe(200);
  });
  it("limita downloads privados simultâneos e libera a vaga ao terminar a resposta", async () => {
    const user = await login("a@example.com"),
      doc = createProject("Downloads", {
        length: 2500,
        width: 1250,
        height: 700,
      });
    const bytes = await sharp({
      create: { width: 2, height: 2, channels: 4, background: "green" },
    })
      .png()
      .toBuffer();
    const resource = randomUUID(),
      asset = {
        id: randomUUID(),
        name: "PNG",
        mime: "image/png" as const,
        width: 2,
        height: 2,
        data: bytes.toString("base64"),
      };
    expect(
      (
        await app.inject({
          method: "POST",
          url: `/api/uploads/${doc.project.id}/${resource}`,
          headers: {
            ...headers(user),
            "content-type": "application/octet-stream",
          },
          payload: bytes,
        })
      ).statusCode,
    ).toBe(200);
    doc.model.customImageAssets.push(asset);
    expect(
      (
        await app.inject({
          method: "POST",
          url: `/api/projects/${doc.project.id}`,
          headers: headers(user),
          payload: {
            ...body(),
            doc: dehydrate(doc, { [`custom:${asset.id}`]: resource }),
          },
        })
      ).statusCode,
    ).toBe(200);
    const service = await createApi(db, config);
    let sent = 0,
      release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    service.addHook("onSend", async (request, reply, payload) => {
      if (request.headers["x-held-image"] && reply.statusCode === 200) {
        sent++;
        await gate;
      }
      return payload;
    });
    const url = `/api/images/${doc.project.id}/${resource}`;
    const responses = Array.from({ length: 4 }, () =>
      service.inject({
        url,
        headers: { ...headers(user), "x-held-image": "yes" },
      }),
    );
    try {
      await expect.poll(() => sent).toBe(4);
      const busy = await service.inject({ url, headers: headers(user) });
      expect(busy.statusCode).toBe(429);
      expect(busy.json().code).toBe("image_busy");
    } finally {
      release();
      await Promise.allSettled(responses);
    }
    try {
      expect(
        (await service.inject({ url, headers: headers(user) })).statusCode,
      ).toBe(200);
    } finally {
      await service.close();
    }
  });
  it("reautenticação revoga somente o identificador substituído, preservando outras sessões", async () => {
    const first = await login("a@example.com"),
      other = await login("a@example.com");
    await db.query(
      "DELETE FROM ecovit_rate_limits WHERE key LIKE 'mail-cooldown:%'",
    );
    const code = await app.inject({
      method: "POST",
      url: "/api/auth/code",
      headers: headers(first),
      payload: { email: first.email, purpose: "login" },
    });
    expect(code.statusCode).toBe(200);
    const message = JSON.parse(
      await readFile(
        path.join(config.mailCapture!, `${code.json().id}.json`),
        "utf8",
      ),
    );
    const verified = await app.inject({
      method: "POST",
      url: "/api/auth/verify",
      headers: headers(first),
      payload: { id: message.id, code: message.code },
    });
    expect(verified.statusCode).toBe(200);
    const flow = first.cookie
      .split(";")
      .find((value) => value.trim().startsWith(`${config.cookie}-flow=`));
    const renewed = {
      ...first,
      cookie: `${flow}; ${cookies(verified)}`,
      csrf: verified.json().csrf,
    };
    expect(
      (await app.inject({ url: "/api/projects", headers: headers(first) }))
        .statusCode,
    ).toBe(401);
    expect(
      (await app.inject({ url: "/api/projects", headers: headers(other) }))
        .statusCode,
    ).toBe(200);
    expect(
      (await app.inject({ url: "/api/projects", headers: headers(renewed) }))
        .statusCode,
    ).toBe(200);
  });
  it("mantém datas do servidor após criar, editar e reabrir", async () => {
    const user = await login("a@example.com"),
      project = await create(user);
    expect(project.result.createdAt).toBe(project.result.updatedAt);
    const changed = dehydrate(project.doc, {});
    changed.metadata.createdAt = "2000-01-01T00:00:00.000Z";
    const saved = await app.inject({
      method: "PUT",
      url: `/api/projects/${project.doc.project.id}`,
      headers: headers(user),
      payload: { ...body("1"), doc: changed },
    });
    expect(saved.statusCode).toBe(200);
    expect(saved.json().createdAt).toBe(project.result.createdAt);
    const read = await app.inject({
      url: `/api/projects/${project.doc.project.id}`,
      headers: headers(user),
    });
    expect(read.json().doc.metadata.createdAt).toBe(project.result.createdAt);
  });
  it("commit com resposta perdida na duplicação conserva cópia, imagens e recibo único", async () => {
    const user = await login("a@example.com"),
      doc = createProject("Origem", { length: 2500, width: 1250, height: 700 });
    const bytes = await sharp({
      create: { width: 2, height: 2, channels: 4, background: "green" },
    })
      .png()
      .toBuffer();
    const asset = {
        id: randomUUID(),
        name: "PNG",
        mime: "image/png" as const,
        data: bytes.toString("base64"),
        width: 2,
        height: 2,
      },
      resource = randomUUID();
    expect(
      (
        await app.inject({
          method: "POST",
          url: `/api/uploads/${doc.project.id}/${resource}`,
          headers: {
            ...headers(user),
            "content-type": "application/octet-stream",
          },
          payload: bytes,
        })
      ).statusCode,
    ).toBe(200);
    doc.model.customImageAssets.push(asset);
    expect(
      (
        await app.inject({
          method: "POST",
          url: `/api/projects/${doc.project.id}`,
          headers: headers(user),
          payload: {
            ...body(),
            doc: dehydrate(doc, { [`custom:${asset.id}`]: resource }),
          },
        })
      ).statusCode,
    ).toBe(200);
    const failing = new Proxy(db, {
      get(target, property) {
        if (property === "connect")
          return async () => {
            const client = await target.connect();
            let mutated = false;
            return new Proxy(client, {
              get(connection, key) {
                if (key === "query")
                  return async (...args: unknown[]) => {
                    const sql = typeof args[0] === "string" ? args[0] : "";
                    if (sql.startsWith("INSERT INTO ecovit_projects"))
                      mutated = true;
                    const result = await Reflect.apply(
                      connection.query,
                      connection,
                      args,
                    );
                    if (sql === "COMMIT" && mutated)
                      throw new Error("Simulated lost COMMIT response");
                    return result;
                  };
                const value = Reflect.get(connection, key);
                return typeof value === "function"
                  ? value.bind(connection)
                  : value;
              },
            });
          };
        const value = Reflect.get(target, property);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
    const risky = await createApi(failing, config);
    const input = {
      ...body("1"),
      name: "Cópia confirmada",
      newId: randomUUID(),
    };
    try {
      expect(
        (
          await risky.inject({
            method: "POST",
            url: `/api/projects/${doc.project.id}/duplicate`,
            headers: headers(user),
            payload: input,
          })
        ).statusCode,
      ).toBe(500);
      const receipt = await app.inject({
        url: `/api/operations/${input.operationId}`,
        headers: headers(user),
      });
      expect(receipt.statusCode).toBe(200);
      expect(receipt.json().projectId).toBe(input.newId);
      const copied = await app.inject({
        url: `/api/projects/${input.newId}`,
        headers: headers(user),
      });
      const image = await app.inject({
        url: `/api/images/${input.newId}/${copied.json().doc.model.customImageAssets[0].resourceId}`,
        headers: headers(user),
      });
      expect(image.statusCode).toBe(200);
      expect(hash(image.rawPayload)).toBe(hash(bytes));
      expect(
        (
          await app.inject({
            method: "POST",
            url: `/api/projects/${doc.project.id}/duplicate`,
            headers: headers(user),
            payload: input,
          })
        ).json(),
      ).toEqual(receipt.json());
      expect(
        (
          await db.query(
            "SELECT count(*)::int AS n FROM ecovit_projects WHERE owner_id=$1",
            [user.id],
          )
        ).rows[0].n,
      ).toBe(2);
    } finally {
      await risky.close();
    }
  });
  it("nega todas as mutações e recibos de outra conta, inclusive com UUID conhecido", async () => {
    const a = await login("a@example.com"),
      b = await login("b@example.com"),
      project = await create(a);
    for (const action of ["trash", "restore", "purge", "duplicate"]) {
      const result = await app.inject({
        method: "POST",
        url: `/api/projects/${project.doc.project.id}/${action}`,
        headers: headers(b),
        payload: {
          ...body("1"),
          ...(action === "duplicate"
            ? { name: "Roubar", newId: randomUUID() }
            : {}),
        },
      });
      expect(result.statusCode).toBe(404);
    }
    expect(
      (
        await app.inject({
          method: "PUT",
          url: `/api/projects/${project.doc.project.id}`,
          headers: headers(b),
          payload: { ...body("1"), doc: dehydrate(project.doc, {}) },
        })
      ).statusCode,
    ).toBe(404);
    expect(
      (
        await app.inject({
          url: `/api/operations/${project.input.operationId}`,
          headers: headers(b),
        })
      ).statusCode,
    ).toBe(404);
    const result = await app.inject({
      method: "POST",
      url: `/api/uploads/${project.doc.project.id}/${randomUUID()}`,
      headers: { ...headers(b), "content-type": "application/octet-stream" },
      payload: Buffer.from("test"),
    });
    expect(result.statusCode).toBe(404);
    expect(
      (
        await db.query(
          "SELECT revision::text FROM ecovit_projects WHERE id=$1",
          [project.doc.project.id],
        )
      ).rows[0].revision,
    ).toBe("1");
  });
  it("opera com role SQL sem privilégios de DDL ou acesso à migração", async () => {
    await db.query(
      "DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='ecovit_runtime_test') THEN CREATE ROLE ecovit_runtime_test LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE; END IF; END $$",
    );
    await db.query(
      "GRANT CONNECT ON DATABASE ecovit_test TO ecovit_runtime_test; GRANT USAGE ON SCHEMA public TO ecovit_runtime_test; GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO ecovit_runtime_test; REVOKE ALL ON ecovit_migrations FROM ecovit_runtime_test; REVOKE CREATE ON SCHEMA public FROM PUBLIC",
    );
    const connection = new URL(config.databaseUrl);
    connection.username = "ecovit_runtime_test";
    const runtime = database(connection.toString());
    const restricted = await createApi(runtime, config);
    try {
      await expect(
        runtime.query("CREATE TABLE denied(id integer)"),
      ).rejects.toMatchObject({ code: "42501" });
      await expect(
        runtime.query("SELECT * FROM ecovit_migrations"),
      ).rejects.toMatchObject({ code: "42501" });
      const user = await login("a@example.com"),
        project = await create(user);
      const response = await restricted.inject({
        method: "PUT",
        url: `/api/projects/${project.doc.project.id}`,
        headers: headers(user),
        payload: { ...body("1"), doc: dehydrate(project.doc, {}) },
      });
      expect(response.statusCode, response.body).toBe(200);
      await cleanup(runtime, config);
    } finally {
      await restricted.close();
      await runtime.end();
    }
  });
  it("importa intenção com mais de 46 MiB, preserva bytes e recusa excesso sem projeto parcial", async () => {
    const user = await login("a@example.com");
    const bytes = await sharp(randomFillSync(Buffer.alloc(3000 * 3000 * 3)), {
      raw: { width: 3000, height: 3000, channels: 3 },
    })
      .jpeg({ quality: 95 })
      .toBuffer();
    expect(bytes.length).toBeLessThan(10 * 1024 * 1024);
    const doc = createProject("Arquivo grande", {
      length: 2500,
      width: 1250,
      height: 700,
    });
    const mapping: Record<string, string> = {};
    for (let i = 0; i < 4; i++) {
      const resource = randomUUID(),
        asset = {
          id: randomUUID(),
          name: `Foto ${i}`,
          mime: "image/jpeg" as const,
          width: 3000,
          height: 3000,
          data: bytes.toString("base64"),
        };
      const upload = await app.inject({
        method: "POST",
        url: `/api/uploads/${doc.project.id}/${resource}`,
        headers: {
          ...headers(user),
          "content-type": "application/octet-stream",
        },
        payload: bytes,
      });
      expect(upload.statusCode, upload.body).toBe(200);
      doc.model.customImageAssets.push(asset);
      mapping[`custom:${asset.id}`] = resource;
    }
    const text = JSON.stringify(doc);
    expect(Buffer.byteLength(text)).toBeGreaterThan(46 * 1024 * 1024);
    expect(Buffer.byteLength(text)).toBeLessThan(50 * 1024 * 1024);
    const result = await app.inject({
      method: "POST",
      url: `/api/projects/${doc.project.id}`,
      headers: headers(user),
      payload: { ...body(), doc: dehydrate(doc, mapping), sourceFile: text },
    });
    expect(result.statusCode, result.body).toBe(200);
    const image = await app.inject({
      url: `/api/images/${doc.project.id}/${Object.values(mapping)[0]}`,
      headers: headers(user),
    });
    expect(hash(image.rawPayload)).toBe(hash(bytes));
    const tooLarge = await app.inject({
      method: "POST",
      url: `/api/uploads/${doc.project.id}/${randomUUID()}`,
      headers: { ...headers(user), "content-type": "application/octet-stream" },
      payload: Buffer.alloc(10 * 1024 * 1024 + 1),
    });
    expect(tooLarge.statusCode).toBe(413);
    const extra = { ...doc.model.customImageAssets[0], id: randomUUID() };
    doc.model.customImageAssets.push(extra);
    mapping[`custom:${extra.id}`] = Object.values(mapping)[0];
    const refused = await app.inject({
      method: "PUT",
      url: `/api/projects/${doc.project.id}`,
      headers: headers(user),
      payload: { ...body("1"), doc: dehydrate(doc, mapping) },
    });
    expect(refused.statusCode).toBe(422);
    expect(
      (
        await db.query(
          "SELECT revision::text FROM ecovit_projects WHERE id=$1",
          [doc.project.id],
        )
      ).rows[0].revision,
    ).toBe("1");
  }, 90000);
  it("sessão expirada não escreve; limites, origem, tamanho e erros não expõem segredos", async () => {
    const user = await login("a@example.com"),
      project = await create(user);
    const rejected = await app.inject({
      method: "PUT",
      url: `/api/projects/${project.doc.project.id}`,
      headers: { ...headers(user), origin: "https://evil.example" },
      payload: { ...body("1"), doc: dehydrate(project.doc, {}) },
    });
    expect(rejected.statusCode).toBe(403);
    expect(rejected.headers["cache-control"]).toBe("no-store");
    expect(rejected.headers["x-content-type-options"]).toBe("nosniff");
    expect(rejected.headers["content-security-policy"]).toContain(
      "frame-ancestors 'none'",
    );
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/auth/code",
          headers: headers(user),
          payload: { email: "x".repeat(4096), purpose: "login" },
        })
      ).statusCode,
    ).toBe(413);
    const malformed = await app.inject({
      method: "PUT",
      url: `/api/projects/${project.doc.project.id}`,
      headers: headers(user),
      payload: { ...body("1"), doc: { model: { referenceImages: null } } },
    });
    expect(malformed.statusCode).toBe(422);
    expect(malformed.body).not.toMatch(/SELECT|postgres|stack|SESSION_SECRET/);
    await db.query(
      "UPDATE ecovit_sessions SET last_seen=clock_timestamp()-interval '8 days' WHERE account_id=$1",
      [user.id],
    );
    expect(
      (
        await app.inject({
          method: "PUT",
          url: `/api/projects/${project.doc.project.id}`,
          headers: headers(user),
          payload: { ...body("1"), doc: dehydrate(project.doc, {}) },
        })
      ).statusCode,
    ).toBe(401);
    expect(
      (
        await db.query(
          "SELECT revision::text FROM ecovit_projects WHERE id=$1",
          [project.doc.project.id],
        )
      ).rows[0].revision,
    ).toBe("1");
  });
  it("Resend recusada não cria conta; Retry-After impede novo envio e timeout conserva desafio", async () => {
    const service = await createApi(db, {
      ...config,
      mailCapture: undefined,
      resendKey: "test-secret",
      mailFrom: "Ecovit <ecovit@idevs.com.br>",
    });
    const initial = await service.inject({ url: "/api/session" });
    const common = {
      cookie: cookies(initial),
      origin: config.origin,
      "x-csrf-token": initial.json().csrf,
    };
    const send = () =>
      service.inject({
        method: "POST",
        url: "/api/auth/code",
        headers: common,
        payload: { email: "a@example.com", purpose: "login" },
      });
    const transport = vi.fn().mockResolvedValue(
      new Response("private provider error", {
        status: 429,
        headers: { "Retry-After": "300" },
      }),
    );
    vi.stubGlobal("fetch", transport);
    try {
      const refused = await send();
      expect(refused.statusCode).toBe(503);
      expect(refused.body).not.toContain("private provider error");
      expect(
        (await db.query("SELECT count(*)::int AS n FROM ecovit_challenges"))
          .rows[0].n,
      ).toBe(0);
      expect((await send()).statusCode).toBe(503);
      expect(transport).toHaveBeenCalledTimes(1);
      await db.query(
        "DELETE FROM ecovit_rate_limits WHERE key='mail-provider' OR key LIKE 'mail-cooldown:%'",
      );
      transport.mockRejectedValueOnce(new Error("timeout"));
      const uncertain = await send();
      expect(uncertain.statusCode).toBe(200);
      expect(uncertain.json().uncertain).toBe(true);
      expect(
        (await db.query("SELECT sent FROM ecovit_challenges")).rows[0].sent,
      ).toBe(true);
      expect(
        (await db.query("SELECT count(*)::int AS n FROM ecovit_accounts"))
          .rows[0].n,
      ).toBe(0);
    } finally {
      vi.unstubAllGlobals();
      await service.close();
    }
  });
});
