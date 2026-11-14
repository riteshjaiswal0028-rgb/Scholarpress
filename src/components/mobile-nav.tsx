import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { notificationsQuery } from "@/lib/queries";
import { Bell, FileText, House, Search, User } from "lucide-react";

// The five tabs on a phone, for everyone. My Research, Notifications and Profile ask a signed-out visitor to sign in first.
const TABS = [
  { to: "/", label: "Home", icon: House, match: (p: string) => p === "/" },
  { to: "/explore", label: "Explore", icon: Search, match: (p: string) => p === "/explore" || p.startsWith("/article") || p.startsWith("/paper") },
  { to: "/my-research", label: "My Research", icon: FileText, match: (p: string) => p === "/my-research" || p.startsWith("/my-research/") },
  { to: "/notifications", label: "Notifications", icon: Bell, match: (p: string) => p === "/notifications" },
  { to: "/profile", label: "Profile", icon: User, match: (p: string) => p === "/profile" },
] as const;
// Pages with their own bottom action bar, or no chrome.
const HIDE_ON = ["/submit", "/auth"];

/** Bottom navigation below lg. Hides while a field is focused so it never rides above the keyboard. */
export function MobileNav() {
  const path = useRouterState({ select: (s) => (s.location.pathname.length > 1 ? s.location.pathname.replace(/\/+$/, "") : s.location.pathname) });
  const [typing, setTyping] = useState(false);
  const { user } = useAuth();
  const { data: notes } = useQuery({ ...notificationsQuery(), enabled: !!user });
  const unread = path !== "/notifications" && (notes ?? []).filter((n) => !n.read_at).length;
  useEffect(() => {
    const isField = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));
    const on = (e: FocusEvent) => setTyping(isField(e.target));
    const off = () => setTyping(false);
    window.addEventListener("focusin", on);
    window.addEventListener("focusout", off);
    return () => { window.removeEventListener("focusin", on); window.removeEventListener("focusout", off); };
  }, []);

  if (typing || HIDE_ON.some((h) => path === h || path.startsWith(h + "/"))) return null;
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 pm-mobile-nav rounded-t-2xl border-t border-border pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_18px_-10px_rgb(27_36_32/0.22)] lg:hidden">
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {TABS.map(({ to, label, icon: Icon, match }) => {
          const active = match(path);
          return (
            <li key={to}>
              <Link to={to} aria-current={active ? "page" : undefined}
                className={`flex min-h-[3.75rem] flex-col items-center justify-center gap-0.5 px-0.5 pt-1.5 text-[11px] font-medium no-underline transition-colors duration-150 ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                <span className="nav-pill grid h-8 w-16 place-items-center rounded-full" data-active={active}>
                  <span className="relative"><Icon className="size-6 shrink-0" strokeWidth={active ? 2.2 : 1.75} fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.16 : 0} aria-hidden="true" />{to === "/notifications" && unread ? <span aria-hidden="true" className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground ring-2 ring-card">{unread > 9 ? "9+" : unread}</span> : null}</span>
                </span>
                <span className={`max-w-full truncate text-center text-[11.5px] leading-tight ${active ? "font-semibold" : ""}`}>{label}{to === "/notifications" && unread ? <span className="sr-only">, {unread} unread</span> : null}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
