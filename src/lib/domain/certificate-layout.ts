import qrcode from "qrcode-generator";
import { CERTIFICATE_DISCLAIMER } from "./constants";

/**
 * One layout, two renderers. The PDF (pdf-lib) and the on-screen certificate (SVG) both draw the operations
 * returned by `layoutCertificate`, so what a person sees online is exactly what they download.
 * All coordinates are pixels of the 2296 x 1623 certificate template (`certificate-template.jpg`, A4 landscape),
 * which is the approved Scholarly design with every per-certificate field left blank.
 */
export const CERT_W = 2296;
export const CERT_H = 1623;

export type CertificateType = "SUBMISSION" | "PUBLICATION" | "PEER_REVIEW" | "AUTHOR_RECORD";
/** The six faces of the design: Cormorant Garamond (serif, serifBold), Playfair Display italic (script, for the recipient) and Inter (sans, sansMedium, sansSemi). */
export type FontKey = "serif" | "serifBold" | "script" | "sans" | "sansMedium" | "sansSemi";
export type Weight = FontKey;
/** Width in template pixels of `text` drawn at `size` pixels. */
export type Measure = (text: string, size: number, weight: Weight) => number;

export interface CertificateData {
  certificateId: string;
  type: CertificateType;
  recipientName: string;
  authorRole: string;
  /** The recipient's ORCID iD, verified through ORCID sign-in and recorded at issue. Null when none was verified. */
  orcid?: string | null;
  paperTitle: string;
  articleId: string;
  doi: string | null;
  /** True when the DOI is a Zenodo Sandbox test DOI (10.5072): it does not resolve at doi.org and the certificate says so. */
  doiSandbox?: boolean;
  publicationDate: string | null;
  issuedAt: string;
  verificationUrl: string;
  /** Live facts about the record at the time the PDF is generated (not printed; kept for callers). */
  recordType?: string;
  reviewStatement?: string;
  publicationStatus?: string;
}

export type TextOp = { kind: "text"; text: string; x: number; y: number; size: number; weight: Weight; color: string; anchor: "start" | "middle" | "end" };
export type LineOp = { kind: "line"; x1: number; y1: number; x2: number; y2: number; width: number; color: string };
export type QrOp = { kind: "qr"; x: number; y: number; size: number; modules: boolean[][]; ink: string; paper: string };
export type CertOp = TextOp | LineOp | QrOp;

export interface CertificateLink { x: number; y: number; w: number; h: number; url: string }
export interface CertificateLayout { ops: CertOp[]; link: { x: number; y: number; w: number; h: number }; /** Extra clickable areas (after the verification link). */ links: CertificateLink[] }

export const CERTIFICATE_TITLES: Record<CertificateType, string> = {
  SUBMISSION: "Certificate of Submission",
  PUBLICATION: "Certificate of Publication",
  PEER_REVIEW: "Certificate of Peer Review",
  AUTHOR_RECORD: "Certificate of Author Record",
};

/** The sentence above the work title, and the small label over it. They never claim more than the record does (see CERTIFICATE_DISCLAIMER). */
const COPY: Record<CertificateType, { intro: string; label: string }> = {
  SUBMISSION: { intro: "has successfully submitted the research paper titled", label: "ARTICLE TITLE" },
  PUBLICATION: { intro: "is recorded as an author of the research work published on Scholarly, titled", label: "ARTICLE TITLE" },
  PEER_REVIEW: { intro: "has completed a confidential peer review assignment, recorded under the reference", label: "REFERENCE" },
  AUTHOR_RECORD: { intro: "is recorded as an author of the research work titled", label: "ARTICLE TITLE" },
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "08 Oct 2026". Always UTC, so a late-evening issue time never shifts to another day. */
export function formatCertificateDate(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) throw new Error("Invalid issue date");
  return `${String(d.getUTCDate()).padStart(2, "0")} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export const INK = "#7a1420"; // crimson of the design
export const GOLD = "#b08d3a";
const DARK = "#1f1a17";
const SLATE = "#2a2623";
const MUTED = "#6b6560";
const CX = 1136; // centre line of the design

function wrap(measure: Measure, text: string, size: number, weight: Weight, maxW: number): string[] {
  const rows: string[] = []; let cur = "";
  const push = () => { if (cur.trim()) rows.push(cur.trim()); cur = ""; };
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = cur ? `${cur} ${word}` : word;
    if (measure(next, size, weight) <= maxW) { cur = next; continue; }
    push();
    if (measure(word, size, weight) <= maxW) { cur = word; continue; }
    for (const ch of word) { // a single word wider than the line: break by character
      if (cur && measure(cur + ch, size, weight) > maxW) push();
      cur += ch;
    }
  }
  push();
  return rows;
}

function shrink(measure: Measure, text: string, size: number, min: number, weight: Weight, maxW: number): number {
  let s = size;
  while (s > min && measure(text, s, weight) > maxW) s -= 0.5;
  return s;
}

/** Largest size (from `size` down to `min`) at which `text` fits in at most `maxLines` lines; falls back to `min`, truncating with an ellipsis. */
function fitLines(measure: Measure, text: string, size: number, min: number, weight: Weight, maxW: number, maxLines: number) {
  for (let s = size; s >= min; s -= 0.5) {
    const rows = wrap(measure, text, s, weight, maxW);
    if (rows.length <= maxLines) return { size: s, rows };
  }
  const rows = wrap(measure, text, min, weight, maxW);
  const kept = rows.slice(0, maxLines);
  let last = kept[maxLines - 1] ?? "";
  while (last && measure(`${last}…`, min, weight) > maxW) last = last.slice(0, -1).trimEnd();
  kept[maxLines - 1] = `${last}…`;
  return { size: min, rows: kept };
}

function qrModules(value: string): boolean[][] {
  const q = qrcode(0, "M"); q.addData(value); q.make();
  const n = q.getModuleCount();
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => q.isDark(r, c)));
}

export function layoutCertificate(d: CertificateData, measure: Measure): CertificateLayout {
  if (!d.recipientName.trim() || !d.certificateId.trim() || !d.articleId.trim()) throw new Error("Certificate identity is incomplete");
  const issueDate = formatCertificateDate(d.issuedAt);
  const ops: CertOp[] = [];
  const links: CertificateLink[] = [];
  const text = (t: string, x: number, y: number, size: number, color: string, anchor: TextOp["anchor"] = "middle", weight: Weight = "sans") =>
    ops.push({ kind: "text", text: t, x, y, size, weight, color, anchor });
  /** Letter-spaced capitals, centred on `cx`, drawn one character at a time. Returns the size used. */
  const tracked = (t: string, cx: number, y: number, size: number, min: number, weight: Weight, color: string, track: number, maxW: number) => {
    const width = (s: number) => [...t].reduce((w, ch) => w + measure(ch, s, weight), 0) + (t.length - 1) * s * track;
    let s = size; while (s > min && width(s) > maxW) s -= 0.5;
    let x = cx - width(s) / 2;
    for (const ch of t) { text(ch, x, y, s, color, "start", weight); x += measure(ch, s, weight) + s * track; }
    return s;
  };

  // "CERTIFICATE" is part of the design; the second line changes with the certificate type ("OF PUBLICATION", "OF PEER REVIEW", ...).
  const ofLine = CERTIFICATE_TITLES[d.type].replace(/^Certificate\s+/i, "").toUpperCase();
  tracked(ofLine, CX, 430, 62, 34, "serifBold", DARK, 0.2, 700);

  // Recipient, above the double rule of the design.
  const NAME_W = 1000;
  const oneLine = shrink(measure, d.recipientName, 84, 50, "script", NAME_W);
  if (measure(d.recipientName, oneLine, "script") <= NAME_W) text(d.recipientName, CX, 600, oneLine, INK, "middle", "script");
  else {
    const f = fitLines(measure, d.recipientName, 50, 28, "script", NAME_W, 2);
    f.rows.forEach((row, i) => text(row, CX, 546 + i * (f.size + 6), f.size, INK, "middle", "script"));
  }
  const roleLine = d.orcid ? `Recorded role: ${d.authorRole}   |   ORCID iD: https://orcid.org/${d.orcid}` : `Recorded role: ${d.authorRole}`;
  text(roleLine, CX, 674, shrink(measure, roleLine, 22, 12, "sans", 1250), MUTED);

  // Sentence, label, work title.
  const copy = COPY[d.type];
  text(copy.intro, CX, 744, shrink(measure, copy.intro, 40, 26, "serif", 1180), SLATE, "middle", "serif");
  tracked(copy.label, CX, 802, 19, 12, "sansSemi", GOLD, 0.34, 400);
  // Work title: one line if it fits at a readable size, otherwise two, otherwise three (truncated with an ellipsis as a last resort).
  const TITLE_W = 1020;
  let work = fitLines(measure, d.paperTitle, 58, 40, "serifBold", TITLE_W, 1);
  if (work.rows.length !== 1 || work.rows[0]!.endsWith("…")) {
    work = fitLines(measure, d.paperTitle, 50, 34, "serifBold", TITLE_W, 2);
    if (work.rows.length > 2 || work.rows[work.rows.length - 1]!.endsWith("…")) work = fitLines(measure, d.paperTitle, 33, 24, "serifBold", TITLE_W, 3);
  }
  const lh = work.size * 1.22;
  const first = ({ 1: 876, 2: 856, 3: 842 } as Record<number, number>)[work.rows.length] ?? 842;
  work.rows.forEach((row, i) => text(row, CX, first + i * lh, work.size, INK, "middle", "serifBold"));

  // Identity row, centred under the labels of the design: certificate ID, reference ID, published (UTC), issue date.
  const published = d.publicationDate ? formatCertificateDate(d.publicationDate) : "—";
  const cols: Array<[string, number, number]> = [[d.certificateId, 709, 275], [d.articleId, 1027, 275], [published, 1332, 255], [issueDate, 1600, 215]];
  for (const [value, x, w] of cols) text(value, x, 1158, shrink(measure, value, 25, 12, "sansMedium", w), SLATE, "middle", "sansMedium");

  // Detail lines under the identity row: the DOI link (publication), or what the record does and does not say.
  let line1: string | null = null; let line2: string | null = null; let line1Color = MUTED;
  if (d.type === "PUBLICATION") {
    const href = d.doi ? `https://doi.org/${d.doi}` : null;
    line1 = href ? (d.doiSandbox ? `DOI: ${href}   (Zenodo Sandbox test DOI; does not resolve publicly)` : `DOI: ${href}`) : "DOI: not registered at issue";
    if (href) line1Color = INK;
    line2 = d.reviewStatement ? `${d.recordType ? `${d.recordType} · ` : ""}${d.reviewStatement}` : null;
  } else if (d.type === "SUBMISSION") {
    // Issued at submission, so it can only say where the work is headed, never that review happened.
    line1 = "Submitted to the Scholarly peer review process · Review outcome not yet decided";
    line2 = "Submission record; not proof of acceptance";
  } else if (d.type === "PEER_REVIEW") {
    line1 = "The manuscript is not named, to protect the confidentiality of the review.";
    line2 = "Confidential review. Not a statement about the manuscript or its outcome.";
  } else {
    line1 = d.doi ? `DOI: ${d.doi}` : "DOI: not registered at issue";
  }
  if (line1) text(line1, CX, 1236, shrink(measure, line1, 25, 12, "sansMedium", 1000), line1Color, "middle", "sansMedium");
  if (line2) text(line2, CX, 1267, shrink(measure, line2, 22, 12, "sans", 1000), MUTED);

  // Left column: verification QR (always) and DOI QR (publication with a confirmed DOI), each with gold corner brackets.
  const bracket = (px: number, py: number, plate: number) => {
    const x0 = px - 8, y0 = py - 8, x1 = px + plate + 8, y1 = py + plate + 8, bl = 28;
    for (const [x, y, dx, dy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]] as const) {
      ops.push({ kind: "line", x1: x, y1: y, x2: x + dx * bl, y2: y, width: 3.5, color: GOLD });
      ops.push({ kind: "line", x1: x, y1: y, x2: x, y2: y + dy * bl, width: 3.5, color: GOLD });
    }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  };
  const PLATE = 217, QX = 211;
  ops.push({ kind: "qr", x: QX, y: 620, size: PLATE, modules: qrModules(d.verificationUrl), ink: "#1b1a17", paper: "#ffffff" });
  const link = bracket(QX, 620, PLATE);
  if (d.type === "PUBLICATION" && d.doi) {
    const href = `https://doi.org/${d.doi}`;
    ops.push({ kind: "qr", x: QX, y: 921, size: PLATE, modules: qrModules(href), ink: "#1b1a17", paper: "#ffffff" });
    const box = bracket(QX, 921, PLATE);
    tracked("DOI", QX + PLATE / 2, 1164, 20, 12, "sansSemi", "#50402e", 0.3, 120);
    links.push({ ...box, url: href });
    // The printed DOI link is clickable too.
    const ds = shrink(measure, line1!, 25, 12, "sansMedium", 1000), dw = Math.min(measure(line1!, ds, "sansMedium"), 1000);
    links.push({ x: CX - dw / 2, y: 1236 - ds, w: dw, h: ds + 10, url: href });
  }

  // Footer: the standing disclaimer followed by the short verification address.
  const url = new URL(d.verificationUrl);
  const footer = `${CERTIFICATE_DISCLAIMER} · ${url.host}${url.pathname}`;
  fitLines(measure, footer, 17.5, 17.5, "sans", 1170, 4).rows.forEach((row, i) => text(row, CX, 1527 + i * 20.5, 17.5, MUTED));

  return { ops, link, links };
}
