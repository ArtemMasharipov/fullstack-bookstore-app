import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { verifyPassword } from "../../utils/passwords.js";
import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { assertLocalMongoUri } from "../../config/mongo-guard.js";
import { childEnv } from "../helpers/process.js";

// The seed CLI (node scripts/seed.js [--reset]) never writes to a
// remote database by accident. Every case runs it in a child process.
const seedPath = fileURLToPath(
  new URL("../../scripts/seed.js", import.meta.url)
);

// The CLI imports config/default.js, which needs a JWT_SECRET; childEnv drops
// the one of this machine
const JWT_SECRET = "seed-cli-test-secret-0123456789abcdef0123456789";

const REMOTE_URI = "mongodb://db.example.com/shop";

const ADMIN_PASSWORD = "Cedar lantern 47!";
const USER_PASSWORD = "Velvet compass 92!";
const PASSWORDS = {
  SEED_ADMIN_PASSWORD: ADMIN_PASSWORD,
  SEED_USER_PASSWORD: USER_PASSWORD,
};

// A working directory without a .env, so nothing but the given environment
// reaches the process
let cwd;

beforeAll(() => {
  cwd = fs.mkdtempSync(path.join(os.tmpdir(), "bookstore-seed-cli-"));
});

afterAll(() => {
  fs.rmSync(cwd, { recursive: true, force: true });
});

// Runs the CLI in a child process. The status is null if it hangs until the
// timeout. Under NODE_ENV=test it reads no .env; env can undo that (undefined).
function runSeed({
  env,
  args = [],
  nodeArgs = [],
  script = seedPath,
  workDir = cwd,
} = {}) {
  const result = spawnSync(process.execPath, [...nodeArgs, script, ...args], {
    cwd: workDir,
    env: childEnv({ NODE_ENV: "test", JWT_SECRET, ...env }),
    encoding: "utf8",
    timeout: 15000,
  });

  return { ...result, output: `${result.stdout}${result.stderr}` };
}

// Database names get a suffix of their own per run: npm run test:watch reruns
// this file on the same in-memory server (globalSetup is not run again), where
// the databases seeded by the previous run are still there
const RUN = randomUUID().slice(0, 8);

// A database of the in-memory server; a test that seeds uses its own
const localUri = (dbName) => {
  const uri = `${inject("mongoUri")}${dbName}_${RUN}`;
  assertLocalMongoUri(uri);
  return uri;
};

async function readDatabase(dbName) {
  const connection = await mongoose
    .createConnection(localUri(dbName))
    .asPromise();

  try {
    const read = (name) => connection.collection(name).find().toArray();
    return {
      users: await read("users"),
      authors: await read("authors"),
      books: await read("books"),
    };
  } finally {
    await connection.close();
  }
}

const countsOf = (database) => ({
  users: database.users.length,
  authors: database.authors.length,
  books: database.books.length,
});

function expectRefused(result) {
  expect(result.status, result.output).toBe(1);
  expect(result.stderr).toContain("non-local MongoDB");
}

describe("seed CLI: a remote database", () => {
  it("is refused before any connection", () => {
    const result = runSeed({ env: { MONGODB_URI: REMOTE_URI } });

    expectRefused(result);
    // The message, not an uncaught error with a stack trace
    expect(result.stderr).not.toMatch(/^\s+at /m);
  });

  it("is refused with --reset even when SEED_ALLOW_REMOTE=true", () => {
    const result = runSeed({
      env: { MONGODB_URI: REMOTE_URI, SEED_ALLOW_REMOTE: "true" },
      args: ["--reset"],
    });

    expectRefused(result);
  });

  it.each(["1", "yes", "TRUE"])(
    "is refused when SEED_ALLOW_REMOTE is %j: only the exact value true allows it",
    (value) => {
      const result = runSeed({
        env: { MONGODB_URI: REMOTE_URI, SEED_ALLOW_REMOTE: value },
      });

      expectRefused(result);
    }
  );

  it("is allowed by SEED_ALLOW_REMOTE=true without --reset: the run goes on to the passwords", () => {
    // No SEED_*_PASSWORD, so it stops there, before it connects anywhere
    const result = runSeed({
      env: { MONGODB_URI: REMOTE_URI, SEED_ALLOW_REMOTE: "true" },
    });

    expect(result.status, result.output).toBe(1);
    expect(result.stderr).toContain("SEED_ADMIN_PASSWORD");
    expect(result.stderr).not.toContain("non-local MongoDB");
  });

  it("is refused without printing its host or credentials", () => {
    const result = runSeed({
      env: {
        MONGODB_URI: "mongodb://seeduser:seedsecret@db.example.com/shop",
        ...PASSWORDS,
      },
    });

    expectRefused(result);
    for (const part of ["seeduser", "seedsecret", "db.example.com"]) {
      expect(result.output).not.toContain(part);
    }
  });

  it("is refused when .env names it: the case this guard exists for", () => {
    // Outside NODE_ENV=test the CLI loads the .env of its working directory.
    // Only that .env has the URI and the JWT_SECRET, and no password is set:
    // without the guard on the URI from .env the run would end differently.
    const dir = fs.mkdtempSync(path.join(cwd, "dotenv-"));
    fs.writeFileSync(
      path.join(dir, ".env"),
      `MONGODB_URI=${REMOTE_URI}\nJWT_SECRET=${JWT_SECRET}\n`
    );

    const result = runSeed({
      env: { NODE_ENV: undefined, JWT_SECRET: undefined },
      workDir: dir,
    });

    expectRefused(result);
    expect(result.output).not.toContain("db.example.com");
  });

  it("is refused when SEED_ALLOW_REMOTE=true is in .env: the flag counts only from the environment of the run", () => {
    // A true kept in .env would let every later run seed the remote database
    // named there. This .env has all a run needs, the passwords included.
    const dir = fs.mkdtempSync(path.join(cwd, "dotenv-allow-"));
    fs.writeFileSync(
      path.join(dir, ".env"),
      `MONGODB_URI=${REMOTE_URI}\nJWT_SECRET=${JWT_SECRET}\n` +
        `SEED_ADMIN_PASSWORD=${ADMIN_PASSWORD}\n` +
        `SEED_USER_PASSWORD=${USER_PASSWORD}\n` +
        "SEED_ALLOW_REMOTE=true\n"
    );

    const result = runSeed({
      env: { NODE_ENV: undefined, JWT_SECRET: undefined },
      workDir: dir,
    });

    expectRefused(result);
    expect(result.output).not.toContain("db.example.com");
  });
});

describe("seed CLI: passwords without a terminal", () => {
  it("exits 1 and names the variables when none is set", () => {
    const result = runSeed({ env: { MONGODB_URI: localUri("seed_cli_none") } });

    expect(result.status, result.output).toBe(1);
    expect(result.stderr).toContain("SEED_ADMIN_PASSWORD");
    expect(result.stderr).toContain("SEED_USER_PASSWORD");
  });

  it.each(["SEED_ADMIN_PASSWORD", "SEED_USER_PASSWORD"])(
    "exits 1 when only %s is set",
    (name) => {
      const result = runSeed({
        env: {
          MONGODB_URI: localUri("seed_cli_one"),
          [name]: "only-one-pass-1",
        },
      });

      expect(result.status, result.output).toBe(1);
      expect(result.stderr).toContain("SEED_ADMIN_PASSWORD");
    }
  );
});

describe("seed CLI: a local database", () => {
  it("seeds it from the passwords of the environment and prints the counts", async () => {
    const result = runSeed({
      env: { MONGODB_URI: localUri("seed_cli_ok"), ...PASSWORDS },
    });

    expect(result.status, result.output).toBe(0);
    expect(result.stdout).toContain("24");
    // Passwords that were given are never printed
    expect(result.output).not.toContain(ADMIN_PASSWORD);
    expect(result.output).not.toContain(USER_PASSWORD);

    const database = await readDatabase("seed_cli_ok");
    expect(countsOf(database)).toEqual({ users: 2, authors: 5, books: 24 });
    const admin = database.users.find((user) => user.role === "admin");
    expect(admin.password).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
    expect(await verifyPassword(ADMIN_PASSWORD, admin.password)).toBe(true);
  });

  it("refuses a second run and exits, then --reset seeds it again", async () => {
    const env = { MONGODB_URI: localUri("seed_cli_again"), ...PASSWORDS };
    expect(runSeed({ env }).status).toBe(0);

    // Exits 1 on its own: after a failure the connection is closed
    const second = runSeed({ env });
    expect(second.status, second.output).toBe(1);
    expect(second.stderr).toContain("already seeded");

    const reset = runSeed({ env, args: ["--reset"] });
    expect(reset.status, reset.output).toBe(0);
    expect(reset.stdout).toContain("24");

    // Not 4 users, 10 authors, 48 books
    expect(countsOf(await readDatabase("seed_cli_again"))).toEqual({
      users: 2,
      authors: 5,
      books: 24,
    });
  });
});

describe("seed CLI: the connected host", () => {
  it("is checked after connecting, and nothing is written when it is not local", async () => {
    // The URI is local, but the connection reports a remote host (what the
    // guard after connecting is for: a second layer, see mongo-guard.js)
    const mongooseUrl = pathToFileURL(
      createRequire(import.meta.url).resolve("mongoose")
    ).href;
    // mongoose assigns host itself while it connects, hence the empty setter
    const pretendRemote = [
      "--import",
      "data:text/javascript," +
        encodeURIComponent(
          `import mongoose from ${JSON.stringify(mongooseUrl)};\n` +
            "Object.defineProperty(mongoose.connection, 'host', {\n" +
            "  get: () => 'db.example.com',\n" +
            "  set: () => {},\n" +
            "});"
        ),
    ];

    const result = runSeed({
      env: { MONGODB_URI: localUri("seed_cli_host"), ...PASSWORDS },
      nodeArgs: pretendRemote,
    });

    // Exits 1 on its own: the connection is closed after the refusal. This is
    // the guard after connecting, not the one on the URI.
    expectRefused(result);
    expect(result.stderr).toContain("connected host");
    expect(result.output).not.toContain("db.example.com");
    const database = await readDatabase("seed_cli_host");
    expect(countsOf(database)).toEqual({ users: 0, authors: 0, books: 0 });
  });
});

describe("seed CLI: in a terminal", () => {
  // A test has no real terminal, so isTTY is set before the CLI starts
  const inTerminal = [
    "--import",
    "data:text/javascript,process.stdout.isTTY=true",
  ];

  const printedPasswords = (stdout) =>
    Object.fromEntries(
      [...stdout.matchAll(/^\s+(\S+@bookstore\.local)\s+(\S+)$/gm)].map(
        ([, email, password]) => [email, password]
      )
    );

  it("generates the passwords that are not set, prints them once and stores them", async () => {
    const result = runSeed({
      env: { MONGODB_URI: localUri("seed_cli_tty") },
      nodeArgs: inTerminal,
    });

    expect(result.status, result.output).toBe(0);
    const printed = printedPasswords(result.stdout);
    expect(Object.keys(printed).sort()).toEqual([
      "admin@bookstore.local",
      "reader@bookstore.local",
    ]);
    for (const password of Object.values(printed)) {
      expect(password).toMatch(/^[A-Za-z0-9_-]{16}$/);
    }
    // Once: on stdout only, and each password a single time
    for (const password of Object.values(printed)) {
      expect(result.output.split(password)).toHaveLength(2);
    }

    // The printed passwords are the stored ones
    const { users } = await readDatabase("seed_cli_tty");
    for (const user of users) {
      const stored = await verifyPassword(printed[user.email], user.password);
      expect(stored, user.email).toBe(true);
    }
  });

  it("generates and prints only the password that is not set", async () => {
    const result = runSeed({
      env: {
        MONGODB_URI: localUri("seed_cli_tty_one"),
        SEED_ADMIN_PASSWORD: ADMIN_PASSWORD,
      },
      nodeArgs: inTerminal,
    });

    expect(result.status, result.output).toBe(0);
    expect(Object.keys(printedPasswords(result.stdout))).toEqual([
      "reader@bookstore.local",
    ]);
    expect(result.output).not.toContain(ADMIN_PASSWORD);
    expect(result.output).not.toContain("admin@bookstore.local");

    const { users } = await readDatabase("seed_cli_tty_one");
    const admin = users.find((user) => user.role === "admin");
    expect(await verifyPassword(ADMIN_PASSWORD, admin.password)).toBe(true);
  });
});

describe("seed.js as the entry module", () => {
  it("runs the CLI when it is started through a symbolic link", () => {
    // import.meta.url is the real path, process.argv[1] the link's: compared
    // as they are, the CLI would silently do nothing and exit 0
    const link = path.join(cwd, "scripts-link");
    // "junction" needs no administrator rights on Windows; others ignore it
    fs.symlinkSync(path.dirname(seedPath), link, "junction");

    try {
      const result = runSeed({
        env: { MONGODB_URI: REMOTE_URI },
        script: path.join(link, "seed.js"),
      });

      expectRefused(result);
    } finally {
      fs.rmSync(link);
    }
  });

  it("reads no .env, evaluates no config and runs no CLI when it is only imported", () => {
    // What a caller such as the e2e server relies on: it sets its own
    // environment after importing seed(). Here NODE_ENV is not "test", so
    // load-env.js would load this .env, and the missing JWT_SECRET would make
    // config/default.js throw.
    const dir = fs.mkdtempSync(path.join(cwd, "import-"));
    fs.writeFileSync(
      path.join(dir, ".env"),
      "MONGODB_URI=mongodb://db.example.com/shop\n" +
        `JWT_SECRET=${JWT_SECRET}\n` +
        "SEED_ADMIN_PASSWORD=from-dotenv-1\n"
    );
    const seedUrl = JSON.stringify(pathToFileURL(seedPath).href);
    const script =
      "const before = JSON.stringify(process.env);\n" +
      `const imported = await import(${seedUrl});\n` +
      "console.log(JSON.stringify({\n" +
      "  envUnchanged: JSON.stringify(process.env) === before,\n" +
      "  exports: Object.keys(imported),\n" +
      "}));";

    const result = spawnSync(
      process.execPath,
      ["--input-type=module", "-e", script],
      {
        cwd: dir,
        env: childEnv({ NODE_ENV: "development" }),
        encoding: "utf8",
        timeout: 15000,
      }
    );
    const output = `${result.stdout}${result.stderr}`;

    expect(result.status, output).toBe(0);
    expect(result.stderr).toBe("");
    const report = JSON.parse(result.stdout);
    expect(report.envUnchanged).toBe(true);
    expect(report.exports).toContain("seed");
  });
});
