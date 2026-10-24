import { describe, expect, it } from "vitest";
import * as policy from "../../utils/passwordPolicy.js";

describe("new password policy", () => {
  it.each([
    ["a".repeat(14), "too_small"],
    ["Cedar 47! moon?", null],
    ["Cedar lantern 47!".padEnd(64, "x"), null],
    ["Cedar lantern 47!".padEnd(128, "x"), null],
    ["x".repeat(129), "too_big"],
    ["123456789012345", "common"],
    ["🙂".repeat(14), "too_small"],
    ["🙂".repeat(15), null],
    ["ﬃ".repeat(43), "too_big"],
    ["細".repeat(15), null],
    ["  Cedar lantern 47!  ", null],
  ])("checks normalized codepoints and blocklist for %j", (input, expected) => {
    expect(policy.newPasswordIssue(input)).toBe(expected);
  });

  it.each([
    ["Trail MEMBER moon 47!", { username: "member" }],
    ["Trail MAILBOX moon 47!", { username: "member", email: "mailbox@example.com" }],
    ["Trail ＢＯＯＫＳＴＯＲＥ moon!", {}],
  ])("refuses contextual words without case or compatibility distinctions", (input, context) => {
    expect(policy.newPasswordIssue(input, context)).toBe("context");
  });

  it("ignores empty account context and preserves password spaces", () => {
    expect(policy.newPasswordIssue("Cedar lantern 47!", { username: "", email: "" })).toBeNull();
    expect(policy.validateNewPassword("  Ｃafe\u0301 lantern 47!  ", {})).toBe("  Café lantern 47!  ");
  });

  it("reports the requested field without echoing the password", () => {
    try {
      policy.validateNewPassword("123456789012345", {}, "newPassword");
      expect.fail("common password was accepted");
    } catch (failure) {
      expect(failure).toMatchObject({ statusCode: 400, code: "VALIDATION_FAILED", fields: { newPassword: "common" } });
      expect(failure.message).not.toContain("123456789012345");
    }
  });
});
