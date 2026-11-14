import { describe, expect, it } from "vitest";
import { checkNewPassword, cleanOtp, isOtp } from "./password";

describe("password reset rules", () => {
  it("cleans and validates the code", () => {
    expect(cleanOtp(" 123 456 ")).toBe("123456");
    expect(isOtp("123456")).toBe(true);
    expect(isOtp("12345")).toBe(false);
    expect(isOtp("12345a")).toBe(false);
  });
  it("checks the new password", () => {
    expect(checkNewPassword("short", "short")).toMatch(/at least 8/);
    expect(checkNewPassword("longenough1", "different1")).toMatch(/do not match/);
    expect(checkNewPassword("        ", "        ")).toMatch(/only spaces/);
    expect(checkNewPassword("a".repeat(73), "a".repeat(73))).toMatch(/at most 72/);
    expect(checkNewPassword("longenough1", "longenough1")).toBeNull();
  });
});
