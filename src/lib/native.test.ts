import { describe, expect, it } from "vitest";
import { carriesSignIn, isAppPath, pathFromAppLink } from "./native";

const SITE = "https://scholarly.example";
describe("admin app deep links", () => {
  it("opens the site's admin links at the same path", () => {
    expect(pathFromAppLink(`${SITE}/admin#money/payments`, SITE)).toBe("/admin#money/payments");
    expect(pathFromAppLink(`${SITE}/founder`, SITE)).toBe("/founder");
  });
  it("opens the app's tab pages at the same path", () => {
    expect(pathFromAppLink(`${SITE}/article/VLN-1`, SITE)).toBe("/article/VLN-1");
    expect(pathFromAppLink(`${SITE}/my-research`, SITE)).toBe("/my-research");
    expect(pathFromAppLink(`${SITE}/notifications`, SITE)).toBe("/notifications");
  });
  it("sends every other page of this site to the admin panel", () => {
    expect(pathFromAppLink(`${SITE}/fees`, SITE)).toBe("/admin");
    expect(pathFromAppLink(`${SITE}/policies`, SITE)).toBe("/admin");
  });
  it("maps scholarpress:// links to paths", () => {
    expect(pathFromAppLink("scholarpress://admin", SITE)).toBe("/admin");
    expect(pathFromAppLink("scholarpress://founder", SITE)).toBe("/founder");
    expect(pathFromAppLink("scholarpress://explore", SITE)).toBe("/explore");
    expect(pathFromAppLink("scholarpress://fees", SITE)).toBe("/admin");
    expect(pathFromAppLink("scholarpress://auth/callback?code=abc", SITE)).toBe("/admin?code=abc");
    expect(pathFromAppLink("scholarpress://auth/callback#access_token=t&refresh_token=r", SITE)).toBe("/admin#access_token=t&refresh_token=r");
  });
  it("ignores links to other sites and other schemes", () => {
    expect(pathFromAppLink("https://evil.example/admin", SITE)).toBeNull();
    expect(pathFromAppLink("javascript:alert(1)", SITE)).toBeNull();
    expect(pathFromAppLink("intent://x#Intent;end", SITE)).toBeNull();
    expect(pathFromAppLink("not a url", SITE)).toBeNull();
  });
  it("knows which pages the app may show", () => {
    for (const ok of ["/admin", "/admin/x", "/founder", "/auth", "/profile", "/", "/explore", "/my-research", "/notifications", "/article/VLN-1", "/manuscript/1", "/my-research/abc", "/zenodo/callback", "/orcid/callback"]) expect(isAppPath(ok)).toBe(true);
    for (const no of ["/administrator", "/fees", "/policies", "/about", "/verify"]) expect(isAppPath(no)).toBe(false);
  });
  it("reloads the page only for links that carry a sign-in result", () => {
    expect(carriesSignIn("/admin?code=abc")).toBe(true);
    expect(carriesSignIn("/admin#access_token=t")).toBe(true);
    expect(carriesSignIn("/admin#money/payments")).toBe(false);
  });
});
