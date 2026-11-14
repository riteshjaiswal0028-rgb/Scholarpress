import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, Download, ExternalLink } from "lucide-react";
import qrcode from "qrcode-generator";
import { toast } from "sonner";
import { myCertsQuery } from "@/lib/queries";
import { certificateDownload } from "@/lib/app.functions";
import { saveCertificatePdf } from "@/lib/certificate-download";
import type { CertificateType } from "@/lib/domain/certificate-layout";
import { CertificateView } from "@/components/certificate-view";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { fmtDate, StatusBadge } from "@/lib/ui";

export function CertificateDelivery({ paperId }: { paperId?: string }) {
  const { data, isLoading, isError, refetch, isFetching } = useQuery(myCertsQuery());
  const [busy, setBusy] = useState<string | null>(null);
  const certificates = data?.filter(c => !paperId || c.paper_id === paperId);
  async function download(id: string) {
    setBusy(id);
    try {
      const r = await certificateDownload({ data: { certificateId: id } });
      if (!r.url) throw new Error("Certificate file is not ready yet");
      await saveCertificatePdf(r.url, id);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not download certificate"); }
    finally { setBusy(null); }
  }
  if (isLoading) return (
    <div role="status" aria-label="Loading certificates" className="grid gap-4 py-2">
      <Skeleton className="h-7 w-2/3" /><Skeleton className="aspect-[3/2] w-full rounded-lg" /><Skeleton className="h-11 w-48 rounded-full" />
    </div>
  );
  if (isError) return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-critical-soft px-4 py-3">
      <p className="text-[15px]">Certificates could not be loaded.</p>
      <Button type="button" variant="outline" size="sm" loading={isFetching} onClick={() => void refetch()}>Try again</Button>
    </div>
  );
  if (!certificates?.length) return paperId
    ? <p className="border-y border-border py-6 text-muted-foreground">No certificate has been issued for this work.</p>
    : <EmptyState icon={Award} title="No certificates yet" action={<Button asChild><Link to="/my-research">View my research</Link></Button>}>A certificate appears here once one has been issued for your work.</EmptyState>;
  return <ul className="grid gap-8">
    {certificates.map(c => {
      const qr = qrcode(0, "M"); qr.addData(c.verificationUrl); qr.make();
      const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr.createSvgTag({ cellSize: 4, margin: 16, scalable: true }))}`;
      return <li key={c.certificate_id} className="pm-cert-card">
        <div className="flex flex-wrap items-center gap-3"><h3 className="text-[1.6rem]">Certificate of {c.certificate_type.replaceAll("_", " ").toLowerCase()}</h3><StatusBadge status={c.status} /></div>
        <div className="pm-cert-frame mt-5">
          <CertificateView data={{
            certificateId: c.certificate_id, type: c.certificate_type as CertificateType, recipientName: c.recipient_name_at_issue, authorRole: c.author_role, orcid: (c as { orcid_at_issue?: string | null }).orcid_at_issue ?? null,
            paperTitle: c.paper_title_at_issue, articleId: c.article_public_id, doi: c.doi_at_issue, publicationDate: c.publication_date, issuedAt: c.issued_at, verificationUrl: c.verificationUrl,
            ...(c.recordType && c.reviewStatement ? { recordType: c.recordType, reviewStatement: c.reviewStatement } : {}),
          }} />
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_128px]">
          <div className="min-w-0">
            <dl className="grid gap-2 text-sm">
              <div><dt className="inline text-muted-foreground">Certificate ID: </dt><dd className="inline break-words tabular-nums">{c.certificate_id}</dd></div>
              <div><dt className="inline text-muted-foreground">Scholarly ID: </dt><dd className="inline break-words tabular-nums">{c.article_public_id}</dd></div>
              <div><dt className="inline text-muted-foreground">Issued (UTC): </dt><dd className="inline">{fmtDate(c.issued_at)}</dd></div>
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={() => download(c.certificate_id)} disabled={busy !== null}><Download className="size-4" />{busy === c.certificate_id ? "Preparing PDF…" : "Download PDF"}</Button>
              <Button variant="outline" asChild><Link to="/verify/certificate/$certId" params={{ certId: c.certificate_id }} search={{ t: c.verification_token }}><ExternalLink className="size-4" />View online</Link></Button>
            </div>
          </div>
          <a href={c.verificationUrl} aria-label={`Verify certificate ${c.certificate_id} online`} className="self-start text-center text-xs text-muted-foreground">
            <img src={src} alt="QR code for online certificate verification" className="h-32 w-32" width={128} height={128} />
            Scan to view online
          </a>
        </div>
      </li>;
    })}
  </ul>;
}
