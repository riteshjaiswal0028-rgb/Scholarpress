import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";

const TRIGGER = 72; // px of pull needed to refresh
const MAX = 110;

/** Pull down at the top of any page (public site and admin) to refresh its data.
 *  Touch only. Ignored inside fields, dialogs and scrolling panels, so it never fights normal scrolling. */
export function PullToRefresh() {
  const qc = useQueryClient();
  const router = useRouter();
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);
  const start = useRef<number | null>(null);
  const pullRef = useRef(0);

  useEffect(() => {
    const blocked = (t: EventTarget | null) => {
      for (let el = t instanceof HTMLElement ? t : null; el; el = el.parentElement) {
        if (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || el.isContentEditable || el.getAttribute("role") === "dialog") return true;
        if (el.scrollTop > 0) return true;
      }
      return false;
    };
    const onStart = (e: TouchEvent) => {
      start.current = window.scrollY <= 0 && !blocked(e.target) && e.touches.length === 1 ? (e.touches[0]?.clientY ?? null) : null;
    };
    const onMove = (e: TouchEvent) => {
      if (start.current === null) return;
      const y = e.touches[0]?.clientY;
      if (y === undefined) return;
      const dy = y - start.current;
      if (dy <= 0) { pullRef.current = 0; setPull(0); return; }
      pullRef.current = Math.min(MAX, dy * 0.5);
      setPull(pullRef.current);
    };
    const onEnd = () => {
      const done = pullRef.current >= TRIGGER;
      start.current = null; pullRef.current = 0; setPull(0);
      if (!done) return;
      setBusy(true);
      void Promise.allSettled([qc.invalidateQueries(), router.invalidate()]).finally(() => setTimeout(() => setBusy(false), 400));
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onEnd, { passive: true });
    return () => { window.removeEventListener("touchstart", onStart); window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onEnd); window.removeEventListener("touchcancel", onEnd); };
  }, [qc, router]);

  const shown = busy ? TRIGGER * 0.7 : pull;
  if (shown <= 0) return null;
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center lg:hidden" style={{ transform: `translateY(calc(env(safe-area-inset-top) + ${Math.max(8, shown - 36)}px))` }}>
      <span className="grid size-10 place-items-center rounded-full border border-border bg-card text-primary shadow-md">
        <RefreshCw aria-hidden="true" className={`size-5 ${busy ? "animate-spin" : ""}`} style={busy ? undefined : { transform: `rotate(${(pull / TRIGGER) * 270}deg)`, opacity: Math.min(1, pull / 30) }} />
        <span className="sr-only">{busy ? "Refreshing" : pull >= TRIGGER ? "Release to refresh" : "Pull to refresh"}</span>
      </span>
    </div>
  );
}
