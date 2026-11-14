import { useEffect, useState } from "react";
import { ArrowLeft, Eye, EyeOff, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkNewPassword, cleanOtp, isOtp, MIN_PASSWORD } from "@/lib/domain/password";

type Step = "email" | "code" | "new";
const RESEND_SECONDS = 60;

/**
 * Forgot password / set a password by e-mail, in three steps: e-mail address, the code we send (verification), new password.
 * It also works for people who signed up with Google and want a password: the same e-mail proves they own the address.
 * The e-mailed link (opens /auth?reset=1) lands straight on the last step. The page never says whether an account exists.
 */
export function PasswordReset({ initialStep = "email", initialEmail = "", onBack, onDone }: {
  initialStep?: Step; initialEmail?: string; onBack: () => void; onDone: () => void;
}) {
  const [step, setStep] = useState<Step>(initialStep);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState(""); const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const [wait, setWait] = useState(0);

  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait((w) => w - 1), 1000); return () => clearTimeout(t); }, [wait]);

  async function sendCode() {
    setErr(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setErr("Enter a valid email address."); document.getElementById("reset-email")?.focus(); return; }
    setBusy(true);
    try {
      const r = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth?reset=1` });
      if (r.error) { setErr(r.error.message); return; }
      setCode(""); setStep("code"); setWait(RESEND_SECONDS);
    } catch (e) { setErr(e instanceof Error && e.message ? e.message : "Something went wrong. Check your connection and try again."); }
    finally { setBusy(false); }
  }
  async function verify() {
    setErr(null);
    if (!isOtp(code)) { setErr("Enter the code from the email (6 to 10 digits)."); document.getElementById("reset-code")?.focus(); return; }
    setBusy(true);
    try {
      const r = await supabase.auth.verifyOtp({ email: email.trim(), token: code, type: "recovery" });
      if (r.error) { setErr("That code is wrong or has expired. Check it, or ask for a new one."); return; }
      setStep("new");
    } catch (e) { setErr(e instanceof Error && e.message ? e.message : "Something went wrong. Check your connection and try again."); }
    finally { setBusy(false); }
  }
  async function save() {
    setErr(null);
    const bad = checkNewPassword(pw, pw2);
    if (bad) { setErr(bad); document.getElementById(pw.length < MIN_PASSWORD ? "reset-pw" : "reset-pw2")?.focus(); return; }
    setBusy(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { setErr("This reset has expired. Start again to get a new code."); setStep("email"); return; }
      const r = await supabase.auth.updateUser({ password: pw });
      if (r.error) { setErr(r.error.message); return; }
      try { await supabase.auth.signOut({ scope: "others" }); } catch { /* other devices stay signed in if this fails */ }
      toast.success("Password saved. You are signed in.");
      onDone();
    } catch (e) { setErr(e instanceof Error && e.message ? e.message : "Something went wrong. Check your connection and try again."); }
    finally { setBusy(false); }
  }

  const titles: Record<Step, [string, string]> = {
    email: ["Reset your password", "Enter your account email. We send a code to confirm it is you. This also works if you signed up with Google and want to add a password."],
    code: ["Check your email", `If an account exists for ${email.trim()}, we sent a code. Enter it here. You can also open the link in that email.`],
    new: ["Choose a new password", `Use at least ${MIN_PASSWORD} characters. Other devices will be signed out.`],
  };
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (busy) return; void (step === "email" ? sendCode() : step === "code" ? verify() : save()); };

  return (
    <div>
      <button type="button" onClick={onBack} className="-ml-2 mb-4 inline-flex h-10 items-center gap-1 rounded-full px-2 text-[15px] font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ArrowLeft aria-hidden="true" className="size-4" />Back to sign in</button>
      <h1 key={step} className="pm-display animate-in fade-in-0 slide-in-from-bottom-1 text-[2.1rem] duration-300">{titles[step][0]}</h1>
      <p className="mt-3 text-[17px] leading-relaxed text-muted-foreground">{titles[step][1]}</p>
      {err && <div role="alert" className="mt-6 rounded-lg border border-destructive bg-critical-soft px-4 py-3"><p className="font-semibold text-destructive">There is a problem</p><p className="mt-1 text-[15px]">{err}</p></div>}
      <form onSubmit={submit} noValidate className="mt-7 space-y-5">
        {step === "email" && (
          <div className="space-y-2"><Label htmlFor="reset-email">Email address</Label>
            <Input id="reset-email" type="email" inputMode="email" autoComplete="email" spellCheck={false} autoFocus value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        )}
        {step === "code" && (
          <div className="space-y-2"><Label htmlFor="reset-code">Code from the email</Label>
            <Input id="reset-code" inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={10} value={code} onChange={(e) => setCode(cleanOtp(e.target.value))} className="text-center text-2xl tracking-[0.35em]" />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><MailCheck aria-hidden="true" className="size-4" />Codes expire after a short time.</span>
              <button type="button" disabled={wait > 0 || busy} onClick={() => void sendCode()} className="font-semibold text-foreground underline-offset-4 hover:underline disabled:text-muted-foreground disabled:no-underline">{wait > 0 ? `Resend in ${wait}s` : "Send a new code"}</button>
            </div>
            <button type="button" onClick={() => { setErr(null); setStep("email"); }} className="text-sm font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Use a different email</button>
          </div>
        )}
        {step === "new" && (<>
          <div className="space-y-2"><Label htmlFor="reset-pw">New password</Label>
            <div className="relative">
              <Input id="reset-pw" type={show ? "text" : "password"} autoComplete="new-password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} className="pr-12" />
              <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show} className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {show ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}
              </button>
            </div></div>
          <div className="space-y-2"><Label htmlFor="reset-pw2">Repeat the new password</Label>
            <Input id="reset-pw2" type={show ? "text" : "password"} autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
        </>)}
        <Button size="lg" className="w-full" disabled={busy}>{busy ? "Please wait…" : step === "email" ? "Send code" : step === "code" ? "Verify code" : "Save password"}</Button>
      </form>
    </div>
  );
}
