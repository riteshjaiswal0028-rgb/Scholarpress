import { isNativeApp, NATIVE_AUTH_REDIRECT, useIsNative } from "@/lib/native";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cleanAge, cleanPersonName, MAX_AGE, MIN_AGE } from "@/lib/domain/referrals";
import { cleanPhone, DEFAULT_COUNTRY } from "@/lib/domain/phone";
import { PhoneField } from "@/components/phone-field";
import { PasswordReset } from "@/components/password-reset";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Sign in to Scholarly" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "description", content: "Sign in or create a Scholarly account to submit and track research." },
    { property: "og:title", content: "Sign in to Scholarly" }, { property: "og:description", content: "Sign in or create an account." },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up" | "reset">("in");
  // Opened from the link in the reset email (/auth?reset=1): the person already has a recovery session, so go straight to choosing a password.
  const [fromLink] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("reset") === "1");
  const inApp = useIsNative();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [showPw, setShowPw] = useState(false);
  const [fullName, setFullName] = useState(""); const [age, setAge] = useState("");
  const [phoneCountry, setPhoneCountry] = useState(DEFAULT_COUNTRY); const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false); const [gBusy, setGBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fe, setFe] = useState<Record<string, string>>({});

  useEffect(() => {
    const q = new URLSearchParams(window.location.search + "&" + window.location.hash.replace(/^#/, ""));
    const msg = q.get("error_description") ?? q.get("error");
    if (msg) { setError(msg.replace(/\+/g, " ")); window.history.replaceState({}, "", window.location.pathname); }
  }, []);
  // A referral link lands here as /auth?join=1 (no code, nothing identifying): open on "Create an account".
  useEffect(() => { if (new URLSearchParams(window.location.search).get("join") === "1") setMode("up"); }, []);
  useEffect(() => { if (fromLink) setMode("reset"); }, [fromLink]);
  useEffect(() => {
    let live = true;
    (async () => {
      try { const { data } = await supabase.auth.getSession(); if (live && data.session && !fromLink) nav({ to: isNativeApp() ? "/admin" : "/my-research" }); }
      catch { /* session restore failed: stay on the sign-in form */ }
    })();
    return () => { live = false; };
  }, [nav, fromLink]);

  function switchMode(m: "in" | "up") { if (m === mode) return; setMode(m); setError(null); setFe({}); setShowPw(false); }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    // Every check runs again on the server; a missing value shows the details pop-up after sign-in.
    const errs: Record<string, string> = {};
    const name = cleanPersonName(fullName, email); const years = cleanAge(age); const tel = cleanPhone(phoneCountry, phone);
    if (mode === "up") {
      if (!name) errs["fullname"] = "Enter your full name.";
      if (!years) errs["age"] = `Enter your age, ${MIN_AGE} to ${MAX_AGE}.`;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs["email"] = "Enter a valid email address.";
    if (mode === "up" && !tel) errs["phone"] = "Enter a valid phone number for the country you chose.";
    if (!password) errs["pw"] = "Enter your password.";
    else if (mode === "up" && password.length < 8) errs["pw"] = "Use at least 8 characters.";
    setFe(errs);
    if (Object.keys(errs).length) { document.getElementById(({ fullname: "fullname", age: "age", email: "email", phone: "phone", pw: "pw" } as Record<string, string>)[Object.keys(errs)[0]!]!)?.focus(); return; }
    setBusy(true);
    try {
      const r = mode === "in"
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin, data: { full_name: name, age: years, phone_country: tel?.country, phone_national: tel?.national } } });
      if (r.error) { setError(r.error.message); return; }
      if (mode === "up" && !r.data.session) { toast.success("Check your email to confirm your account."); return; }
      nav({ to: isNativeApp() ? "/admin" : "/my-research" });
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Something went wrong. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }
  async function google() {
    setGBusy(true); setError(null);
    try {
      if (isNativeApp()) {
        // Google refuses sign-in inside an app's embedded browser, so it opens in the phone's browser and comes back through scholarpress://auth/callback.
        const r = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: NATIVE_AUTH_REDIRECT, skipBrowserRedirect: true, queryParams: { prompt: "select_account" } } });
        if (r.error || !r.data.url) { setError(r.error?.message ?? "Google sign-in could not start. Try again."); return; }
        const { Browser } = await import("@capacitor/browser");
        await Browser.open({ url: r.data.url });
        return;
      }
      const r = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/my-research`, queryParams: { prompt: "select_account" } } });
      if (r.error) setError(r.error.message);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Google sign-in could not start. Try again.");
    } finally {
      setGBusy(false);
    }
  }

  const fieldErr = (k: string) => fe[k] ? <p id={`${k}-e`} role="alert" className="text-sm text-destructive">{fe[k]}</p> : null;
  const inv = (k: string) => (fe[k] ? { "aria-invalid": true as const, "aria-describedby": `${k}-e` } : {});
  const bad = (k: string) => (fe[k] ? "border-destructive" : "");

  if (mode === "reset") return (
    <div className="pm-auth-card mx-auto my-8 max-w-md sm:my-16">
      <p className="eyebrow mb-3">Scholarly account</p>
      <PasswordReset initialStep={fromLink ? "new" : "email"} initialEmail={email} onBack={() => { setMode("in"); window.history.replaceState({}, "", window.location.pathname); }} onDone={() => nav({ to: isNativeApp() ? "/admin" : "/my-research" })} />
    </div>
  );

  return (
    <div className="pm-auth-card mx-auto my-8 max-w-md sm:my-16">
      <p className="eyebrow mb-3">Scholarly account</p>
      <h1 key={mode} className="pm-display animate-in fade-in-0 slide-in-from-bottom-1 text-[2.4rem] duration-300">{mode === "in" ? "Sign in" : "Create an account"}</h1>
      <p className="mt-3 text-[17px] leading-relaxed text-muted-foreground">{mode === "in" ? "Use your Scholarly account to submit research and follow its progress." : "You need an account to submit research and follow its progress."}</p>

      {!inApp && (
        <div role="tablist" aria-label="Sign in or create an account" className="mt-7 grid grid-cols-2 gap-1 rounded-full bg-secondary p-1">
          {([["in", "Sign in"], ["up", "Create account"]] as const).map(([m, label]) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => switchMode(m)}
              className={`h-11 rounded-full text-[15px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{label}</button>
          ))}
        </div>
      )}

      {error && (
        <div role="alert" className="mt-6 rounded-lg border border-destructive bg-critical-soft px-4 py-3">
          <p className="font-semibold text-destructive">There is a problem</p>
          <p className="mt-1 text-[15px]">{error}</p>
        </div>
      )}

      <Button variant="outline" size="lg" className="mt-7 w-full" onClick={google} disabled={gBusy}>
        <svg viewBox="0 0 24 24" className="!size-[18px]" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.27-2.09 3.57-5.17 3.57-8.81Z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.87-3a7.2 7.2 0 0 1-10.7-3.78H1.4v3.09A12 12 0 0 0 12 24Z"/><path fill="#FBBC05" d="M5.36 14.31a7.2 7.2 0 0 1 0-4.62V6.6H1.4a12 12 0 0 0 0 10.8l3.96-3.09Z"/><path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.43-3.43A11.95 11.95 0 0 0 12 0 12 12 0 0 0 1.4 6.6l3.96 3.09A7.16 7.16 0 0 1 12 4.77Z"/></svg>
        {gBusy ? "Opening Google…" : mode === "in" ? "Continue with Google" : "Sign up with Google"}
      </Button>
      {mode === "up" && <p className="mt-2 text-center text-sm text-muted-foreground">With Google we only ask for your age and phone number afterwards.</p>}
      <div className="my-6 flex items-center gap-4 text-sm text-muted-foreground" role="separator"><span className="h-px flex-1 bg-border" />or use your email address<span className="h-px flex-1 bg-border" /></div>

      <form key={mode} onSubmit={submit} className="animate-in fade-in-0 slide-in-from-bottom-1 space-y-5 duration-300" noValidate>
        {mode === "up" && (
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_6.5rem] sm:gap-4">
            <div className="space-y-2"><Label htmlFor="fullname">Full name</Label><Input id="fullname" autoComplete="name" maxLength={120} value={fullName} onChange={(e) => setFullName(e.target.value)} className={bad("fullname")} {...inv("fullname")} />{fieldErr("fullname")}</div>
            <div className="space-y-2"><Label htmlFor="age">Age</Label><Input id="age" inputMode="numeric" autoComplete="off" maxLength={3} value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))} className={bad("age")} {...inv("age")} />{fieldErr("age")}</div>
          </div>
        )}
        <div className="space-y-2"><Label htmlFor="email">Email address</Label><Input id="email" type="email" inputMode="email" autoComplete="email" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} className={bad("email")} {...inv("email")} />{fieldErr("email")}</div>
        {mode === "up" && (
          <div className="space-y-2"><Label htmlFor="phone">Phone number</Label>
            <PhoneField id="phone" country={phoneCountry} onCountry={setPhoneCountry} value={phone} onValue={setPhone} invalid={!!fe["phone"]} describedBy={fe["phone"] ? "phone-e" : undefined} />
            {fieldErr("phone")}
          </div>
        )}
        <div className="space-y-2"><Label htmlFor="pw">Password</Label>
          {mode === "up" && !fe["pw"] && <p className="text-sm text-muted-foreground">Use at least 8 characters.</p>}
          <div className="relative">
            <Input id="pw" type={showPw ? "text" : "password"} autoComplete={mode === "in" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} className={`pr-12 ${bad("pw")}`} {...inv("pw")} />
            <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"} aria-pressed={showPw} className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {showPw ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}
            </button>
          </div>
          {fieldErr("pw")}
          {mode === "in" && <button type="button" onClick={() => { setError(null); setFe({}); setMode("reset"); }} className="h-10 text-[15px] font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Forgot password?</button>}
        </div>
        <Button size="lg" className="w-full" disabled={busy}>{busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}</Button>
      </form>
    </div>
  );
}
