import { describe, expect, it } from "vitest";
import {
  ConfigError,
  loadConfig,
  resolveMongoUri,
} from "../../config/default.js";

// loadConfig reads only the object it is given, never process.env, so every
// case passes its own environment.

// A complete production environment; the cases change one thing in it
const production = {
  NODE_ENV: "production",
  JWT_SECRET: "x".repeat(32),
  CORS_ORIGIN: "https://shop.example",
  MONGODB_URI: "mongodb://db.internal/shop",
};
const inProduction = (overrides) => ({ ...production, ...overrides });

// The smallest valid environment outside production
const inDevelopment = (overrides) => ({
  NODE_ENV: "development",
  JWT_SECRET: "dev",
  ...overrides,
});

// The ConfigError loadConfig throws for this environment; anything else it
// throws (a bug) or no error at all fails the test
function rejected(env) {
  try {
    loadConfig(env);
  } catch (error) {
    if (error instanceof ConfigError) return error;
    throw error;
  }
  throw new Error("loadConfig accepted this environment");
}

// The config loadConfig returns, or the problems it reports
function outcome(env) {
  try {
    return { config: loadConfig(env) };
  } catch (error) {
    if (error instanceof ConfigError) return { problems: error.problems };
    throw error;
  }
}

// Matches a problem line that names the variable
const about = (name) => expect.stringContaining(name);

describe("loadConfig result", () => {
  it("accepts a complete production environment", () => {
    const config = loadConfig(production);

    expect(config.port).toBe(3000);
    expect(config.exposeErrorDetails).toBe(false);
  });

  it("is frozen and has the shape its consumers read", () => {
    const config = loadConfig(production);

    expect(config).toEqual({
      port: 3000,
      nodeEnv: "production",
      database: { uri: "mongodb://db.internal/shop" },
      jwt: { secret: "x".repeat(32), expiresIn: "7d" },
      cors: {
        origin: "https://shop.example",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        credentials: false,
        allowedHeaders: ["Content-Type", "Authorization"],
      },
      exposeErrorDetails: false,
      commerce: {
        currency: "CZK",
        vatRatePercent: 0,
        shippingFee: 9900,
        freeShippingThreshold: 100000,
      },
    });
    expect(Object.isFrozen(config)).toBe(true);
    expect(Object.isFrozen(config.commerce)).toBe(true);
  });

  it("passes JWT_EXPIRATION, JWT_AUDIENCE, JWT_ISSUER, CORS_METHODS and CORS_CREDENTIALS through", () => {
    const config = loadConfig(
      inProduction({
        JWT_EXPIRATION: "1h",
        JWT_AUDIENCE: "shop-users",
        JWT_ISSUER: "shop-api",
        CORS_METHODS: "GET,POST",
        CORS_CREDENTIALS: "true",
      })
    );

    expect(config.jwt).toMatchObject({
      expiresIn: "1h",
      audience: "shop-users",
      issuer: "shop-api",
    });
    expect(config.cors.methods).toEqual(["GET", "POST"]);
    expect(config.cors.credentials).toBe(true);
  });

  it.each(["development", "test"])(
    "gives local defaults in %s with only a JWT_SECRET",
    (nodeEnv) => {
      const config = loadConfig({ NODE_ENV: nodeEnv, JWT_SECRET: "dev" });

      expect(config.cors.origin).toBe("http://localhost:8080");
      expect(config.database.uri).toBe("mongodb://localhost:27017/bookStoreDB");
      expect(config.port).toBe(3000);
    }
  );
});

describe("loadConfig errors", () => {
  it("throws a ConfigError that server.js can recognise by its name", () => {
    const error = rejected(inProduction({ JWT_SECRET: undefined }));

    expect(error).toBeInstanceOf(ConfigError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ConfigError");
  });

  it("lists every problem, one per line of the message", () => {
    const error = rejected(
      inProduction({ JWT_SECRET: undefined, CORS_ORIGIN: "*" })
    );

    expect(error.problems).toHaveLength(2);
    expect(error.problems).toEqual(
      expect.arrayContaining([about("JWT_SECRET"), about("CORS_ORIGIN")])
    );
    expect(error.message).toBe(error.problems.join("\n"));
  });

  it("reports problems of unrelated variables together", () => {
    const error = rejected({ NODE_ENV: "staging", PORT: "abc" });

    expect(error.problems).toEqual(
      expect.arrayContaining([about("NODE_ENV"), about("PORT"), about("JWT_SECRET")])
    );
    expect(error.problems).toHaveLength(3);
  });

  it("lists everything production needs when nothing else is set", () => {
    const error = rejected({ NODE_ENV: "production" });

    expect(error.problems).toHaveLength(3);
    expect(error.message).toContain("JWT_SECRET");
    expect(error.message).toContain("CORS_ORIGIN");
    expect(error.message).toContain("MONGODB_URI");
  });

  it("never repeats a rejected value in its message", () => {
    const error = rejected(
      inProduction({ JWT_SECRET: "sentinel-secret", PORT: "sentinel-port" })
    );

    expect(error.problems).toHaveLength(2);
    expect(error.message).not.toContain("sentinel");
  });
});

describe("empty strings", () => {
  // Every variable set to a non-default value: blanking one must give the same
  // result as removing it. (MONGODB_URI is left out because it would shadow
  // MONGODB_URL and DATABASE_NAME; resolveMongoUri covers it.)
  const everything = {
    NODE_ENV: "test",
    PORT: "8080",
    JWT_SECRET: "dev",
    JWT_EXPIRATION: "1h",
    JWT_AUDIENCE: "shop-users",
    JWT_ISSUER: "shop-api",
    CORS_ORIGIN: "http://localhost:5173",
    CORS_METHODS: "GET,POST",
    CORS_CREDENTIALS: "true",
    MONGODB_URL: "mongodb://127.0.0.1:27018",
    DATABASE_NAME: "b",
    EXPOSE_ERROR_DETAILS: "true",
    COMMERCE_VAT_RATE_PERCENT: "21",
    COMMERCE_SHIPPING_FEE: "4900",
    COMMERCE_FREE_SHIPPING_THRESHOLD: "50000",
  };

  it.each(Object.keys(everything))('treat %s="" as not set', (name) => {
    const removed = { ...everything };
    delete removed[name];

    expect(outcome({ ...everything, [name]: "" })).toEqual(outcome(removed));
  });
});

describe("NODE_ENV", () => {
  it("defaults to development", () => {
    expect(loadConfig({ JWT_SECRET: "dev" }).nodeEnv).toBe("development");
  });

  it.each(["development", "test", "production"])("accepts %s", (nodeEnv) => {
    expect(loadConfig(inProduction({ NODE_ENV: nodeEnv })).nodeEnv).toBe(nodeEnv);
  });

  it("rejects any other value", () => {
    const error = rejected(inProduction({ NODE_ENV: "staging" }));

    expect(error.problems).toEqual([about("NODE_ENV")]);
  });
});

describe("PORT", () => {
  it.each([
    ["0", 0],
    ["80", 80],
    ["3000", 3000],
    ["65535", 65535],
  ])("accepts %j as %i", (value, port) => {
    expect(loadConfig(inProduction({ PORT: value })).port).toBe(port);
  });

  it.each([
    "abc",
    "-1",
    "65536",
    "3000.5",
    "1e3",
    "0x50",
    "+80",
    " 80",
    "80 ",
    "99999999999999999999",
  ])("rejects %j", (value) => {
    const error = rejected(inProduction({ PORT: value }));

    expect(error.problems).toEqual([about("PORT")]);
  });
});

describe("JWT_SECRET", () => {
  it("is required in production", () => {
    const error = rejected(inProduction({ JWT_SECRET: undefined }));

    expect(error.problems).toEqual([about("JWT_SECRET")]);
  });

  it("must have at least 32 characters in production", () => {
    const error = rejected(inProduction({ JWT_SECRET: "x".repeat(31) }));

    expect(error.problems).toEqual([about("JWT_SECRET")]);
    expect(() => loadConfig(inProduction({ JWT_SECRET: "x".repeat(32) }))).not.toThrow();
  });

  it.each(["development", "test"])(
    "is required in %s too, empty or missing",
    (nodeEnv) => {
      const empty = rejected({ NODE_ENV: nodeEnv, JWT_SECRET: "" });
      const missing = rejected({ NODE_ENV: nodeEnv });

      expect(empty.problems).toEqual([about("JWT_SECRET")]);
      expect(missing.problems).toEqual([about("JWT_SECRET")]);
    }
  );

  it("can be short outside production", () => {
    expect(loadConfig(inDevelopment()).jwt.secret).toBe("dev");
  });
});

describe("CORS_ORIGIN", () => {
  it.each([undefined, "*"])("is refused in production when it is %j", (value) => {
    const error = rejected(inProduction({ CORS_ORIGIN: value }));

    expect(error.problems).toEqual([about("CORS_ORIGIN")]);
  });

  it.each(["development", "test"])(
    "keeps an explicit value in %s, even *",
    (nodeEnv) => {
      const origin = (value) =>
        loadConfig(inDevelopment({ NODE_ENV: nodeEnv, CORS_ORIGIN: value })).cors
          .origin;

      expect(origin("http://localhost:5173")).toBe("http://localhost:5173");
      expect(origin("*")).toBe("*");
    }
  );
});

describe("database URI", () => {
  it("is required in production as MONGODB_URI or MONGODB_URL", () => {
    const error = rejected(inProduction({ MONGODB_URI: undefined }));

    expect(error.problems).toEqual([about("MONGODB_URI")]);
  });

  it("does not come from DATABASE_NAME alone in production", () => {
    const error = rejected(
      inProduction({ MONGODB_URI: undefined, DATABASE_NAME: "shop" })
    );

    expect(error.problems).toEqual([about("MONGODB_URI")]);
  });

  it("is built from MONGODB_URL and DATABASE_NAME in production", () => {
    const config = loadConfig(
      inProduction({
        MONGODB_URI: undefined,
        MONGODB_URL: "mongodb://h:1/",
        DATABASE_NAME: "db",
      })
    );

    expect(config.database.uri).toBe("mongodb://h:1/db");
  });

  it("is the one in the config exactly as resolveMongoUri returns it", () => {
    const env = inDevelopment({
      MONGODB_URL: "mongodb://127.0.0.1:27018//",
      DATABASE_NAME: "other",
    });

    expect(loadConfig(env).database.uri).toBe(resolveMongoUri(env));
  });
});

describe("resolveMongoUri", () => {
  it("defaults to the local bookStoreDB", () => {
    expect(resolveMongoUri({})).toBe("mongodb://localhost:27017/bookStoreDB");
  });

  it("returns MONGODB_URI as it is, ahead of MONGODB_URL and DATABASE_NAME", () => {
    expect(
      resolveMongoUri({
        MONGODB_URI: "mongodb://u:p@db.internal:27017/shop?authSource=admin",
        MONGODB_URL: "mongodb://other:1",
        DATABASE_NAME: "other",
      })
    ).toBe("mongodb://u:p@db.internal:27017/shop?authSource=admin");
  });

  it("joins MONGODB_URL and DATABASE_NAME, dropping trailing slashes", () => {
    expect(
      resolveMongoUri({ MONGODB_URL: "mongodb://h:1///", DATABASE_NAME: "db" })
    ).toBe("mongodb://h:1/db");
  });

  it("falls back to each default separately", () => {
    expect(resolveMongoUri({ MONGODB_URL: "mongodb://h:1" })).toBe(
      "mongodb://h:1/bookStoreDB"
    );
    expect(resolveMongoUri({ DATABASE_NAME: "db" })).toBe(
      "mongodb://localhost:27017/db"
    );
  });

  it("ignores empty values", () => {
    expect(
      resolveMongoUri({ MONGODB_URI: "", MONGODB_URL: "", DATABASE_NAME: "" })
    ).toBe("mongodb://localhost:27017/bookStoreDB");
    expect(
      resolveMongoUri({
        MONGODB_URI: "",
        MONGODB_URL: "mongodb://h:1",
        DATABASE_NAME: "db",
      })
    ).toBe("mongodb://h:1/db");
  });
});

describe("EXPOSE_ERROR_DETAILS", () => {
  it.each([
    ["development", true],
    ["test", true],
    ["production", false],
  ])("=true in %s gives %s", (nodeEnv, expected) => {
    const config = loadConfig(
      inProduction({ NODE_ENV: nodeEnv, EXPOSE_ERROR_DETAILS: "true" })
    );

    expect(config.exposeErrorDetails).toBe(expected);
  });

  it.each([undefined, "", "false"])("is off when it is %j", (value) => {
    const config = loadConfig(inDevelopment({ EXPOSE_ERROR_DETAILS: value }));

    expect(config.exposeErrorDetails).toBe(false);
  });
});

describe("commerce settings", () => {
  it("defaults to the demo values: CZK, 0 % VAT, 99 Kč shipping, free from 1000 Kč", () => {
    expect(loadConfig(inDevelopment()).commerce).toEqual({
      currency: "CZK",
      vatRatePercent: 0,
      shippingFee: 9900,
      freeShippingThreshold: 100000,
    });
  });

  it("reads the amounts from the environment", () => {
    const { commerce } = loadConfig(
      inDevelopment({
        COMMERCE_VAT_RATE_PERCENT: "12",
        COMMERCE_SHIPPING_FEE: "0",
        COMMERCE_FREE_SHIPPING_THRESHOLD: "250000",
      })
    );

    expect(commerce).toMatchObject({
      vatRatePercent: 12,
      shippingFee: 0,
      freeShippingThreshold: 250000,
    });
  });

  it.each([
    ["COMMERCE_VAT_RATE_PERCENT", ["-1", "101", "1.5", "abc"]],
    ["COMMERCE_SHIPPING_FEE", ["-1", "99.5", "abc"]],
    ["COMMERCE_FREE_SHIPPING_THRESHOLD", ["-1", "0.5", "abc"]],
  ])("rejects a bad %s", (name, values) => {
    for (const value of values) {
      expect(outcome(inDevelopment({ [name]: value })).problems).toEqual([
        about(name),
      ]);
    }
  });
});
