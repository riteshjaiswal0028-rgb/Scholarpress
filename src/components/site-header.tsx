import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Award, ChevronDown, ClipboardCheck, FileText, LayoutDashboard, LogOut, Menu, Search, ShieldCheck, User, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { meQuery, adminQuery } from "@/lib/queries";
import { getFounderSummary } from "@/lib/founder.functions";
import { useIsNative } from "@/lib/native";
import { Button } from "@/components/ui/button";
import { TrustStrip } from "@/components/trust-strip";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Signed-in pages. They live in the account menu (header) and in the footer, so nothing is lost from the top bar.
const ACCOUNT_LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/my-research", label: "My research", icon: FileText },
  { to: "/certificates", label: "My certificates", icon: Award },
  { to: "/reviews", label: "My reviews", icon: ClipboardCheck, needs: ["reviewer"] },
  { to: "/founder", label: "Payments", icon: Wallet, needs: ["founder", "admin", "super_admin"] },
  { to: "/dues", label: "Pay dues", icon: Wallet, needsDues: true },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/admin", label: "Editorial queue", icon: ClipboardCheck, needs: ["editor", "admin", "super_admin"], hideIfAdmin: true },
  { to: "/admin", label: "Admin panel", icon: ShieldCheck, needs: ["admin", "super_admin"] },
] as const;

/** Each link is shown only to people whose roles need it. The server still enforces permissions on every call. */
export function useVisibleLinks() {
  const { user } = useAuth();
  const { data } = useQuery({ ...meQuery(), enabled: !!user, staleTime: 10_000, refetchOnMount: "always" });
  const roles = data?.roles ?? [];
  const duesHold = data?.duesHold === true;
  const hasDues = (data?.dues?.items?.length ?? 0) > 0;
  const isAdmin = roles.some((r) => r === "admin" || r === "super_admin");
  // As soon as the roles are known (right after sign-in), fetch what the admin and founder pages need, so opening them shows content at once.
  const qc = useQueryClient();
  const staffRole = roles.some((r) => ["admin", "super_admin", "editor", "payment_admin"].includes(r));
  const founderRole = isAdmin || roles.includes("founder");
  useEffect(() => {
    if (staffRole) void qc.prefetchQuery(adminQuery());
    if (founderRole) void qc.prefetchQuery({ queryKey: ["founder-summary"], queryFn: () => getFounderSummary(), staleTime: 30_000 });
  }, [qc, staffRole, founderRole]);
  return ACCOUNT_LINKS.filter((l) => {
    if ("hideIfAdmin" in l && l.hideIfAdmin && isAdmin) return false;
    if ("needsDues" in l) return hasDues;
    // A founder with dues pending keeps only the Payments link, which opens the "clear your dues" screen.
    if (duesHold && l.to === "/founder") return true;
    return !("needs" in l) || l.needs.some((n) => roles.includes(n));
  });
}

// Pages that already put the matching action front and centre, so the header does not repeat it.
const OWN_SUBMIT_ACTION = ["/", "/submit", "/my-research"];
const OWN_SEARCH = ["/", "/explore"];

/** True once the page has scrolled a little, so the header can lift off the content. */
function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > threshold);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [threshold]);
  return scrolled;
}

function useCleanPath() {
  const p = useRouterState({ select: (s) => s.location.pathname });
  return p.length > 1 ? p.replace(/\/+$/, "") : p;
}

const MENU_LINKS = [["/explore", "Published research"], ["/submit", "Submit research"], ["/verify", "Verify a certificate"], ["/about", "About"], ["/editorial-board", "Editorial board"], ["/fees", "Fees"], ["/policies", "Policies"]] as const;

/** The hamburger on a phone. It holds the pages that are not bottom tabs, plus sign in or the account pages. */
function MobileMenu({ signedIn, links, onSignOut }: { signedIn: boolean; links: ReadonlyArray<{ to: string; label: string }>; onSignOut: () => void }) {
  const row = "flex min-h-12 items-center border-b border-border text-[1.0625rem] text-foreground no-underline hover:text-primary";
  return (
    <Sheet>
      <SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="Open menu" className="lg:hidden"><Menu className="size-6!" /></Button></SheetTrigger>
      <SheetContent side="right" className="w-[min(20rem,88vw)] overflow-y-auto">
        <SheetHeader><SheetTitle className="flex items-center gap-2.5 font-serif"><img src="/scholarpress-seal.png" alt="" width={512} height={512} decoding="async" className="size-9 rounded-full dark:bg-foreground" />Scholarly</SheetTitle></SheetHeader>
        <nav aria-label="Menu" className="pb-8">
          {MENU_LINKS.map(([to, label]) => <SheetClose key={to} asChild><Link to={to} className={row}>{label}</Link></SheetClose>)}
          <p className="pb-1 pt-6 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Account</p>
          {signedIn ? (
            <>
              {links.map((l) => <SheetClose key={l.label} asChild><Link to={l.to as "/"} className={row}>{l.label}</Link></SheetClose>)}
              <SheetClose asChild><button type="button" onClick={onSignOut} className={`${row} w-full text-left`}>Sign out</button></SheetClose>
            </>
          ) : <SheetClose asChild><Link to="/auth" className={row}>Sign in</Link></SheetClose>}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function SiteHeader() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const path = useCleanPath();
  const native = useIsNative();
  const showSubmit = !native && !OWN_SUBMIT_ACTION.includes(path);
  const showSearch = !native && !OWN_SEARCH.includes(path);
  const signOut = async () => { await supabase.auth.signOut(); router.navigate({ to: "/" }); };
  const scrolled = useScrolled();
  const allLinks = useVisibleLinks();
  const links = native ? allLinks.filter((l) => ["/admin", "/founder", "/dues", "/profile"].includes(l.to)) : allLinks;
  const initial = (user?.email ?? "?").trim().charAt(0).toUpperCase();

  return (
    <header data-scrolled={scrolled} className="site-header sticky top-0 z-40 border-b border-border bg-background/95">
      <a href="#main" className="sr-only rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50">Skip to main content</a>
      <div className="mx-auto flex h-[var(--header-h)] max-w-6xl items-center justify-between gap-4 px-5">
        <Link to="/" className="site-logo flex min-w-0 items-center gap-2.5 no-underline" aria-label="Scholarly International Journal of Medical Innovation, home">
          <img src="/scholarpress-seal.png" alt="" width={512} height={512} decoding="async" fetchPriority="high" className="size-10 shrink-0 rounded-full dark:bg-foreground sm:size-11" />
          {/* The name sits beside the seal. On a phone it is shown where the header has room (no other buttons beside it). */}
          <span className={`min-w-0 flex-col justify-center flex`}>
            <span className="pm-wordmark text-[2rem] font-medium leading-none tracking-[-0.02em] text-primary sm:text-[1.9rem]">Scholarly</span>
            <span className="mt-1 block max-w-[15.5rem] truncate text-[10.5px] font-medium leading-tight tracking-[0.04em] text-muted-foreground sm:max-w-none sm:text-[11.5px]">International Academic Publishing<span className="hidden lg:inline"> · International Journal of Medical Innovation</span></span>
          </span>
        </Link>

        {!native && (
          <nav aria-label="Main" className="pm-nav hidden items-center gap-7 lg:flex">
            {([["/explore", "Research"], ["/about", "About"], ["/editorial-board", "Editorial board"], ["/fees", "Fees"], ["/verify", "Verify"]] as const).map(([to, label]) => (
              <Link key={to} to={to} activeProps={{ className: "active" }}>{label}</Link>
            ))}
          </nav>
        )}

        <MobileMenu signedIn={!!user} links={allLinks} onSignOut={() => { void signOut(); }} />

        <div className="hidden items-center gap-1.5 lg:flex">
          {showSearch && (
            <Button asChild variant="ghost" size="icon" aria-label="Search published research">
              <Link to="/explore"><Search className="size-[18px]!" /></Link>
            </Button>
          )}
          {loading ? (
            <span aria-hidden="true" className="size-9 animate-pulse rounded-full bg-wash" />
          ) : user ? (
            <>
              {showSubmit && <Button asChild size="sm"><Link to="/submit">Submit research</Link></Button>}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" aria-label="Account menu" className="group ml-1 flex items-center gap-1.5 rounded-md border border-border bg-card py-1 pl-1 pr-2 transition-colors duration-150 ease-premium hover:border-foreground/30 data-[state=open]:border-primary/50">
                    <span className="flex size-7 items-center justify-center rounded-md bg-primary text-[13px] font-semibold text-primary-foreground">{initial}</span>
                    <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel className="truncate px-2.5 py-2 text-xs font-medium text-muted-foreground">{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {links.map(({ to, label, icon: Icon }) => (
                    <DropdownMenuItem key={label} asChild>
                      <Link to={to} className="no-underline"><Icon className="text-muted-foreground" />{label}</Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => { void signOut(); }}><LogOut className="text-muted-foreground" />Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost"><Link to="/auth">Sign in</Link></Button>
              {showSubmit && <Button asChild size="sm"><Link to="/submit">Submit research</Link></Button>}
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/** Footer: the link columns (Research, Journal, Account) were removed on purpose. Those pages stay reachable from the header and the bottom tabs. */
export function SiteFooter() {
  return (
    <footer className="pm-footer mt-24">
      <div className="relative mx-auto max-w-6xl px-5 pb-10 pt-12">
        <div>
          <img src="/scholarpress-seal.png" alt="Scholarly International Journal of Medical Innovation" width={512} height={512} loading="lazy" decoding="async" className="size-14 rounded-full dark:bg-foreground" />
          <TrustStrip className="mt-4" />
        </div>
        <div className="mt-8 flex flex-col gap-4 border-t border-border pt-6 text-sm text-muted-foreground md:flex-row md:items-start md:justify-between md:gap-10">
          <p className="max-w-2xl leading-relaxed">
            Scholarly is a scholarly repository, not an accreditation authority. Every submission is peer reviewed by independent reviewers and decided by a human editor before publication; a record is labelled peer reviewed only when completed reviews are recorded. Automated screening is not peer review. Payment does not affect whether a manuscript is accepted.
          </p>
          <div className="flex shrink-0 flex-col gap-2 md:items-end">
            <p>© {new Date().getFullYear()} Scholarly International Journal of Medical Innovation</p>
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })} className="link w-fit font-medium">Back to top</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
