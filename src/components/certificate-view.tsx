import { useEffect, useMemo, useState } from "react";
import templateUrl from "@/assets/certificate-template.jpg";
import { CERT_H, CERT_W, CERTIFICATE_TITLES, layoutCertificate, type CertificateData, type Weight } from "@/lib/domain/certificate-layout";

const SERIF = '"Cormorant Garamond", Lora, Georgia, "Times New Roman", serif';
const SANS = 'Inter, system-ui, "Segoe UI", Arial, sans-serif';
/** CSS for each face of the design; the same six faces the PDF embeds. */
const FACE: Record<Weight, { family: string; weight: number; style: "normal" | "italic" }> = {
  serif: { family: SERIF, weight: 500, style: "normal" },
  serifBold: { family: SERIF, weight: 600, style: "normal" },
  script: { family: '"Playfair Display", Georgia, serif', weight: 500, style: "italic" },
  sans: { family: SANS, weight: 400, style: "normal" },
  sansMedium: { family: SANS, weight: 500, style: "normal" },
  sansSemi: { family: SANS, weight: 600, style: "normal" },
};

/** Measures text with the browser's own font engine (Lora once loaded), so the on-screen layout matches the PDF. */
function makeMeasure() {
  const ctx = typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d");
  return (text: string, size: number, weight: Weight) => {
    if (!ctx) return text.length * size * 0.5;
    const f = FACE[weight];
    ctx.font = `${f.style} ${f.weight} ${size}px ${f.family}`;
    return ctx.measureText(text).width;
  };
}

/** The certificate exactly as issued: same template, same recorded details, same QR as the downloadable PDF. */
export function CertificateView({ data, className }: { data: CertificateData; className?: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    const done = () => { if (live) setReady(true); };
    if (typeof document !== "undefined" && document.fonts) {
      Promise.all(Object.values(FACE).map((f) => document.fonts.load(`${f.style} ${f.weight} 24px ${f.family}`))).then(done, done);
    } else done();
    return () => { live = false; };
  }, []);

  const layout = useMemo(() => (ready ? layoutCertificate(data, makeMeasure()) : null), [ready, data]);
  const label = `${CERTIFICATE_TITLES[data.type]} ${data.certificateId}: ${data.recipientName}, ${data.paperTitle}`;

  if (!layout) return <div role="status" aria-label="Loading certificate" className={`aspect-[3/2] w-full animate-pulse bg-muted ${className ?? ""}`} />;
  return (
    <svg viewBox={`0 0 ${CERT_W} ${CERT_H}`} role="img" aria-label={label} className={`block h-auto w-full ${className ?? ""}`} xmlns="http://www.w3.org/2000/svg">
      <image href={templateUrl} x={0} y={0} width={CERT_W} height={CERT_H} />
      {layout.ops.map((op, i) => {
        if (op.kind === "text") {
          const f = FACE[op.weight];
          return <text key={i} x={op.x} y={op.y} fontSize={op.size} fontWeight={f.weight} fontStyle={f.style} fill={op.color} textAnchor={op.anchor} fontFamily={f.family}>{op.text}</text>;
        }
        if (op.kind === "line") return <line key={i} x1={op.x1} y1={op.y1} x2={op.x2} y2={op.y2} stroke={op.color} strokeWidth={op.width} />;
        const n = op.modules.length, cell = op.size / (n + 8);
        let path = "";
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (op.modules[r]![c]) path += `M${(op.x + (c + 4) * cell).toFixed(2)} ${(op.y + (r + 4) * cell).toFixed(2)}h${cell.toFixed(2)}v${cell.toFixed(2)}h${(-cell).toFixed(2)}z`;
        return <g key={i}><rect x={op.x} y={op.y} width={op.size} height={op.size} fill={op.paper} /><path d={path} fill={op.ink} shapeRendering="crispEdges" /></g>;
      })}
      {layout.links.map((l, i) => <a key={`l${i}`} href={l.url} target="_blank" rel="noopener noreferrer"><rect x={l.x} y={l.y} width={l.w} height={l.h} fill="transparent" /></a>)}
    </svg>
  );
}
