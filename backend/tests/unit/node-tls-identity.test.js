import { checkServerIdentity } from "node:tls";
import { describe, expect, it } from "vitest";

describe("TLS certificate host identity", () => {
  const numericDns = { subject: { CN: "127.0.0.1" }, subjectaltname: "DNS:127.0.0.1" };

  it("rejects a fullwidth numeric host authenticated only as DNS", () => {
    expect(checkServerIdentity("\uff11\uff12\uff17.0.0.1", numericDns))
      .toMatchObject({ code: "ERR_TLS_CERT_ALTNAME_INVALID" });
  });

  it("rejects a canonical IP with only a DNS SAN", () => {
    expect(checkServerIdentity("127.0.0.1", numericDns))
      .toMatchObject({ code: "ERR_TLS_CERT_ALTNAME_INVALID" });
  });

  it("accepts a canonical IP with its IP SAN", () => {
    expect(checkServerIdentity("127.0.0.1", { subjectaltname: "IP Address:127.0.0.1" })).toBeUndefined();
  });

  it("accepts an ordinary host with its DNS SAN", () => {
    expect(checkServerIdentity("bookstore.test", { subjectaltname: "DNS:bookstore.test" })).toBeUndefined();
  });
});
