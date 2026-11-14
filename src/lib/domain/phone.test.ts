import { describe, expect, it } from "vitest";
import { COUNTRIES, cleanPhone, countryByIso, sortedCountries } from "./phone";

describe("phone", () => {
  it("lists India, Kyrgyzstan, Uzbekistan, Kazakhstan and Pakistan first, then the rest A to Z", () => {
    const { priority, others } = sortedCountries();
    expect(priority.map((c) => c.iso)).toEqual(["IN", "KG", "UZ", "KZ", "PK"]);
    expect(others.some((c) => c.iso === "IN")).toBe(false);
    expect(others.map((c) => c.name)).toEqual([...others.map((c) => c.name)].sort((a, b) => a.localeCompare(b)));
    expect(priority.length + others.length).toBe(COUNTRIES.length);
  });
  it("has unique ISO codes", () => { expect(new Set(COUNTRIES.map((c) => c.iso)).size).toBe(COUNTRIES.length); });
  it("accepts normal numbers and returns E.164", () => {
    expect(cleanPhone("IN", "98765 43210")?.e164).toBe("+919876543210");
    expect(cleanPhone("IN", "09876543210")?.e164).toBe("+919876543210");
    expect(cleanPhone("IN", "+91 98765-43210")?.e164).toBe("+919876543210");
    expect(cleanPhone("PK", "(300) 123 4567")?.e164).toBe("+923001234567");
    expect(cleanPhone("UZ", "90 123 45 67")?.e164).toBe("+998901234567");
    expect(cleanPhone("KG", "700 123 456")?.e164).toBe("+996700123456");
    expect(cleanPhone("KZ", "8 701 234 5678")?.e164).toBe("+77012345678");
    expect(cleanPhone("GB", "7911 123456")?.e164).toBe("+447911123456");
  });
  it("rejects wrong lengths, letters, the wrong code and repeated digits", () => {
    expect(cleanPhone("IN", "98765")).toBeNull();
    expect(cleanPhone("IN", "98765432109876")).toBeNull();
    expect(cleanPhone("IN", "98765abc10")).toBeNull();
    expect(cleanPhone("IN", "+92 300 123 4567")).toBeNull();
    expect(cleanPhone("IN", "0000000000")).toBeNull();
    expect(cleanPhone("ZZ", "9876543210")).toBeNull();
    expect(cleanPhone("IN", 9876543210)).toBeNull();
    expect(cleanPhone("IN", "")).toBeNull();
  });
  it("finds a country by ISO code in any case", () => { expect(countryByIso("kg")?.name).toBe("Kyrgyzstan"); expect(countryByIso("zz")).toBeUndefined(); });
});
