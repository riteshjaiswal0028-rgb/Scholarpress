import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { getMyOrcid, orcidConnectUrl } from "@/lib/app.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { meQuery } from "@/lib/queries";
import { Facts, PageTitle, fmtDate } from "@/lib/ui";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile | Scholarly" }, { name: "description", content: "Scholarly research records, submissions and verification." }, { property: "og:title", content: "Profile | Scholarly" }, { property: "og:description", content: "Scholarly research records, submissions and verification." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Profile,
});

function Profile() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({ queryKey: ["my-orcid"], queryFn: () => getMyOrcid() });
  const me = useQuery(meQuery());
  const account = me.data?.profile as { display_name?: string | null; email?: string | null } | null | undefined;
  const [busy, setBusy] = useState(false);
  async function connect() {
    setBusy(true);
    try { const r = await orcidConnectUrl(); window.location.assign(r.url); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not start ORCID sign-in"); setBusy(false); }
  }
  return (
    <div className="mx-auto max-w-3xl px-5 pt-10">
      <PageTitle eyebrow="Account" title="Profile" subtitle="Your researcher identity on Scholarly." />

      {account && (account.display_name || account.email) && (
        <section className="mb-10 space-y-3">
          <h2 className="text-[1.25rem]">Account</h2>
          <Facts items={[...(account.display_name ? [["Name", account.display_name] as [string, string]] : []), ...(account.email ? [["Email", account.email] as [string, string]] : [])]} />
        </section>
      )}

      <section className="space-y-3 border-t border-border pt-6">
        <h2 className="text-[1.25rem]">ORCID iD</h2>
        {isLoading && (
          <div role="status" aria-label="Loading ORCID status" className="space-y-3">
            <Skeleton className="h-5 w-4/5" /><Skeleton className="h-5 w-3/5" /><Skeleton className="h-11 w-48 rounded-full" />
          </div>
        )}
        {isError && !isLoading && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-critical-soft px-4 py-3">
            <p className="text-[15px]">Your ORCID status could not be loaded.</p>
            <Button type="button" variant="outline" size="sm" loading={isFetching} onClick={() => void refetch()}>Try again</Button>
          </div>
        )}
        {data?.verified && (
          <p className="text-[15px]"><Badge className="mr-2 align-middle">Verified</Badge><a className="link tabular-nums" href={`https://orcid.org/${data.verified.orcid}`} rel="noopener">{data.verified.orcid}</a>, confirmed through ORCID sign-in on {fmtDate(data.verified.verified_at)}.</p>
        )}
        {data && !data.verified && (
          <>
            <p className="max-w-[62ch] text-[15px] text-muted-foreground">An ORCID iD is only shown as verified after you sign in to ORCID and approve the link. Typing an iD is not enough, and nobody can claim an iD that belongs to someone else.</p>
            {data.configured
              ? <Button onClick={connect} disabled={busy}>{busy ? "Opening ORCID…" : "Connect your ORCID iD"}</Button>
              : <p role="status" className="rounded-lg border border-border bg-wash px-3 py-2 text-sm">ORCID sign-in is not configured on this site yet.</p>}
            {data.configured && data.sandbox && <p className="text-xs text-muted-foreground">This site is connected to the ORCID sandbox for testing. Sandbox iDs are not real researcher records.</p>}
          </>
        )}
      </section>
    </div>
  );
}
