import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Bell } from "lucide-react";
import { notificationsQuery } from "@/lib/queries";
import { markNotificationsRead } from "@/lib/app.functions";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications | Scholarly" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) => { void context.queryClient.prefetchQuery(notificationsQuery()); },
  component: Notifications,
});

const when = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function Notifications() {
  const { data, isLoading, error } = useQuery(notificationsQuery());
  const qc = useQueryClient();
  const unread = (data ?? []).some((n) => !n.read_at);
  // Opening the page counts as reading what is on it. The list keeps its unread dots until it is next loaded.
  useEffect(() => { if (unread) void markNotificationsRead().then(() => qc.invalidateQueries({ queryKey: ["notifications"], refetchType: "none" })).catch(() => {}); }, [unread, qc]);
  return (
    <div className="mx-auto max-w-3xl px-5 pt-8 sm:pt-10">
      <h1 className="pm-display text-[length:var(--text-page)]">Notifications</h1>
      <p className="mt-2 text-muted-foreground">Updates on your submissions, reviews and certificates.</p>
      <div className="mt-6">
        {isLoading && <div role="status" aria-label="Loading notifications" className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>}
        {error && <p role="alert" className="rounded-lg border border-destructive bg-critical-soft px-4 py-3 text-[15px]">Notifications could not be loaded. Try again in a moment.</p>}
        {data && data.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl border border-border bg-secondary px-6 py-12 text-center">
            <Bell aria-hidden="true" className="size-8 text-muted-foreground" strokeWidth={1.5} />
            <p className="mt-3 font-serif text-xl font-semibold">You are all caught up.</p>
            <p className="mt-1 text-[15px] text-muted-foreground">New updates will appear here.</p>
          </div>
        )}
        {data && data.length > 0 && (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
            {data.map((n) => {
              const inner = (
                <>
                  <span aria-hidden="true" className={`mt-2 size-2 shrink-0 rounded-full ${n.read_at ? "bg-transparent" : "bg-primary"}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium leading-snug">{n.title}</span>
                    <span className="mt-1 block text-[15px] leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">{n.body}</span>
                    <span className="mt-1.5 block text-[13px] text-muted-foreground">{when(n.created_at)}</span>
                  </span>
                </>
              );
              const internal = n.link && n.link.startsWith("/") && !n.link.startsWith("//");
              return (
                <li key={n.id}>
                  {internal ? <Link to={n.link as "/"} className="flex gap-3 px-4 py-4 no-underline hover:bg-accent/50">{inner}</Link> : <div className="flex gap-3 px-4 py-4">{inner}</div>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
